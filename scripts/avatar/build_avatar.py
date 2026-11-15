"""讲解员形象素材处理：保留透明底（白底则抠掉），缩小，并从闭眼/张嘴图中取出眼睛和嘴的小块。

用法：python3 scripts/avatar/build_avatar.py <原图目录>
原图目录内需要：idle、blink、talk1、talk2、read、point（png 或 webp，1024×1536，透明底或白底，人物位置一致）。
输出到 src/assets/avatar/：idle/read/point 为透明底整图；eyes/mouth1/mouth2 为贴在 idle 上的小块；
layout.json 记录小块在整图上的位置（百分比）。只依赖 Pillow 和 numpy。
"""
import json, sys, os
from collections import deque
import numpy as np
from PIL import Image, ImageFilter

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), '..', '..', 'src', 'assets', 'avatar')
W, H = 1024, 1536
SCALE = 0.5                      # 输出 512×768
EYES = (396, 228, 634, 304)      # 眼睛区域（原图像素）
MOUTH = (452, 346, 588, 446)     # 嘴部区域

def load(name):
    for ext in ('png', 'webp'):
        p = os.path.join(SRC, f'{name}.{ext}')
        if os.path.exists(p):
            im = Image.open(p).convert('RGBA')
            assert im.size == (W, H), (name, im.size)
            return im
    raise FileNotFoundError(name)

def cutout(im):
    """原图自带透明背景时直接使用；否则从四边向内漫水填充近白色区域作为背景（轮廓线会挡住填充，白衬衫不受影响）。"""
    if np.asarray(im)[..., 3].min() < 250: return im
    a = np.asarray(im.convert('RGB')).astype(int)
    white = (a.min(axis=2) >= 238)
    bg = np.zeros((H, W), bool)
    dq = deque()
    for x in range(W):
        for y in (0, H - 1):
            if white[y, x] and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if white[y, x] and not bg[y, x]: bg[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y - 1, x), (y + 1, x), (y, x - 1), (y, x + 1)):
            if 0 <= ny < H and 0 <= nx < W and white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; dq.append((ny, nx))
    alpha = Image.fromarray(np.where(bg, 0, 255).astype('uint8'))
    alpha = alpha.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.8))   # 收一圈，去白边
    out = im.copy(); out.putalpha(alpha)
    return out

def save(im, name, quality=86):
    im = im.resize((round(im.width * SCALE), round(im.height * SCALE)), Image.LANCZOS)
    p = os.path.join(OUT, name + '.webp'); im.save(p, 'WEBP', quality=quality, method=6)
    return os.path.getsize(p)

def patch(src, box, feather=6):
    """取一小块，四周羽化，贴到 idle 上时不留边。"""
    x0, y0, x1, y1 = box
    crop = src.convert('RGB').crop(box).convert('RGBA')
    m = Image.new('L', crop.size, 0)
    m.paste(255, (feather, feather, crop.width - feather, crop.height - feather))
    crop.putalpha(m.filter(ImageFilter.GaussianBlur(feather / 2)))
    return crop

HEAD = (330, 120, 700, 480)      # 站立图的头部区域，用来对齐其他姿势

def gray(im, f):
    """贴到白底上转灰度并缩小 f 倍，便于比对。"""
    bg = Image.new('RGBA', im.size, (255, 255, 255, 255)); bg.alpha_composite(im)
    return np.asarray(bg.convert('L').resize((im.width // f, im.height // f), Image.BILINEAR)).astype(np.float32)

def align(pose, idle):
    """找出把姿势图的头部对到站立图头部所需的缩放和平移（先粗后细）。返回 (scale, dx, dy)，单位为原图像素。"""
    best = None
    def search(f, scales, centre, radius):
        nonlocal best
        base = gray(idle, f); x0, y0, x1, y1 = [v // f for v in HEAD]; tpl = base[y0:y1, x0:x1]
        for s in scales:
            w, h = round(W * s), round(H * s)
            g = gray(pose.resize((w, h), Image.BILINEAR), f)
            cx, cy = centre(s)
            for dy in range(cy - radius, cy + radius + 1):
                for dx in range(cx - radius, cx + radius + 1):
                    sx, sy = x0 - dx, y0 - dy
                    if sx < 0 or sy < 0 or sx + tpl.shape[1] > g.shape[1] or sy + tpl.shape[0] > g.shape[0]: continue
                    e = float(np.abs(g[sy:sy + tpl.shape[0], sx:sx + tpl.shape[1]] - tpl).mean())
                    if best is None or e < best[0]: best = (e, s, dx * f, dy * f)
    search(8, [x / 100 for x in range(70, 116, 2)], lambda s: (0, 0), 26)
    _, s0, dx0, dy0 = best; best = None
    search(4, [s0 + x / 200 for x in range(-4, 5)], lambda s: (dx0 // 4, dy0 // 4), 4)
    return best[1], best[2], best[3], best[0]

os.makedirs(OUT, exist_ok=True)
sizes = {}; poses = {}
idle_cut = cutout(load('idle'))
for name in ('idle', 'read', 'point'):
    im = cutout(load(name)); sizes[name] = save(im, name)
    if name != 'idle':
        s, dx, dy, err = align(im, idle_cut)
        # 页面上用 CSS 变换：先缩放再平移，均以整图宽高的百分比表示
        poses[name] = {'scale': round(s, 4), 'x': round(dx / W * 100, 3), 'y': round(dy / H * 100, 3), 'bottom': round((dy + H * s) / H * 100, 2), 'err': round(err, 1)}
sizes['eyes'] = save(patch(load('blink'), EYES), 'eyes', 90)
sizes['mouth1'] = save(patch(load('talk1'), MOUTH), 'mouth1', 90)
sizes['mouth2'] = save(patch(load('talk2'), MOUTH), 'mouth2', 90)
pct = lambda b: [round(b[0] / W * 100, 3), round(b[1] / H * 100, 3), round((b[2] - b[0]) / W * 100, 3), round((b[3] - b[1]) / H * 100, 3)]
json.dump({'note': '小块在整图上的位置：left、top、width、height（百分比）。由 scripts/avatar/build_avatar.py 生成。', 'eyes': pct(EYES), 'mouth': pct(MOUTH), 'poses': poses}, open(os.path.join(OUT, 'layout.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(sizes, sum(sizes.values()))
print(poses)
