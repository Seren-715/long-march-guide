"""长征沙盘鸟瞰图：用 Blender（bpy）程序化建模、渲染，并输出网页叠加用的坐标。

这是“地形示意”，不是地图：
  - 只表现长征途经地区大致的地势（西高东低、横断山深谷、雪山、草地沼泽、黄土高原等），
    山脉、河流的位置和形状都经过简化与夸张，用于营造“路途凶险”的氛围；
  - 不绘制任何国界、省界、海岸线，不标注行政区名称，地形块为方形沙盘；
  - 节点按真实经纬度的相对位置摆放（近似值），只用于示意先后与方位。

用法（需要 Blender 的 Python 模块 bpy 与 numpy，建议放在独立虚拟环境中）：
  python -m venv venv && ./venv/bin/pip install bpy numpy
  ./venv/bin/python scripts/map/build_map.py
输出：
  src/assets/longmarch-map.webp   鸟瞰渲染图
  src/map-layout.json             节点、路线示意、地名标签在图上的位置（百分比）
可选环境变量：MAP_SAMPLES（Cycles 采样数，默认 96）、MAP_RES（地形网格分辨率，默认 360）。
"""

import json
import math
import os
import sys

import bpy
import mathutils
import numpy as np
from bpy_extras.object_utils import world_to_camera_view

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OUT_IMG = os.path.join(ROOT, 'src', 'assets', 'longmarch-map.webp')
OUT_JSON = os.path.join(ROOT, 'src', 'map-layout.json')
SAMPLES = int(os.environ.get('MAP_SAMPLES', '96'))
RES = int(os.environ.get('MAP_RES', '360'))
IMG_W, IMG_H = 1600, 1000

# —— 坐标：经纬度 → 场景平面（等距投影，按纬度压缩经度）——
LON0, LON1, LAT0, LAT1 = 99.6, 117.6, 24.2, 38.4
LONC, LATC = (LON0 + LON1) / 2, (LAT0 + LAT1) / 2
KX = math.cos(math.radians(LATC))
def to_xy(lon, lat):
    return (lon - LONC) * KX, (lat - LATC)
HALF_W, HALF_H = (LON1 - LON0) * KX / 2, (LAT1 - LAT0) / 2

# 节点的近似经纬度（示意用）
NODES = {
    'start': (115.6, 25.95), 'xiangjiang': (111.0, 25.75), 'tongdao': (109.8, 26.15),
    'zunyi': (106.9, 27.70), 'chishui': (105.9, 28.20), 'jinsha': (102.45, 26.15),
    'luding': (102.20, 29.90), 'jiajin': (102.75, 30.80), 'caodi': (102.95, 33.15),
    'lazikou': (103.80, 34.10), 'wuqi': (108.20, 36.90), 'zhiluozhen': (108.75, 36.00),
    'huining': (105.05, 35.70), 'jiangtaibao': (105.95, 35.85),
}
# 只在中央红军主力的 11 个节点之间画示意虚线（按时间顺序）
ROUTE = ['start', 'xiangjiang', 'tongdao', 'zunyi', 'chishui', 'jinsha', 'luding', 'jiajin', 'caodi', 'lazikou', 'wuqi']

# 河流（示意折线，经纬度）与宽度、下切深度
RIVERS = {
    '湘江': ([(110.4, 25.2), (111.0, 25.75), (111.8, 26.6), (112.6, 27.6), (112.9, 28.6)], 0.10, 0.10),
    '乌江': ([(105.0, 26.6), (106.3, 26.9), (107.3, 27.4), (107.7, 28.4), (107.9, 29.6)], 0.09, 0.16),
    '赤水河': ([(104.7, 27.3), (105.4, 27.8), (105.9, 28.2), (105.8, 28.8)], 0.07, 0.12),
    '金沙江': ([(99.8, 27.9), (100.6, 26.9), (101.6, 26.2), (102.45, 26.15), (103.2, 26.9), (103.9, 27.8), (104.6, 28.7)], 0.10, 0.75),
    '大渡河': ([(101.9, 31.6), (102.1, 30.6), (102.2, 29.9), (102.5, 29.3), (103.2, 29.3), (103.8, 29.6)], 0.08, 0.70),
    '岷江': ([(103.7, 32.8), (103.6, 31.6), (103.8, 30.5), (104.3, 29.0)], 0.07, 0.30),
}
# 地名标签（只标自然地物和关隘，不标行政区）
LABELS = [
    ('横断山脉', 100.4, 29.6, 'mount'), ('岷山', 104.45, 32.7, 'mount'), ('黄土高原', 112.3, 36.9, 'mount'),
    ('六盘山', 107.0, 34.55, 'mount'), ('娄山关', 107.35, 28.55, 'pass'), ('乌蒙山', 104.3, 26.6, 'mount'),
    ('金沙江', 100.6, 27.3, 'river'), ('大渡河', 103.2, 28.9, 'river'), ('乌江', 107.9, 29.3, 'river'),
    ('湘江', 112.5, 27.6, 'river'),
]

# —— 地形高度场 ——
rng = np.random.default_rng(1934)
def value_noise(x, y, freq, seed):
    r = np.random.default_rng(seed)
    gx, gy = int(math.ceil((LON1 - LON0) * freq)) + 3, int(math.ceil((LAT1 - LAT0) * freq)) + 3
    grid = r.random((gy, gx))
    fx, fy = (x - LON0) * freq, (y - LAT0) * freq
    ix, iy = np.floor(fx).astype(int), np.floor(fy).astype(int)
    tx, ty = fx - ix, fy - iy
    tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
    a, b = grid[iy, ix], grid[iy, ix + 1]
    c, d = grid[iy + 1, ix], grid[iy + 1, ix + 1]
    return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + d * tx) * ty
def fbm(x, y, base, octaves, seed):
    v, amp, tot = 0.0, 1.0, 0.0
    for o in range(octaves):
        v = v + amp * value_noise(x, y, base * 2 ** o, seed + o); tot += amp; amp *= 0.5
    return v / tot
def ridged(x, y, base, octaves, seed):
    v, amp, tot = 0.0, 1.0, 0.0
    for o in range(octaves):
        n = 1 - np.abs(value_noise(x, y, base * 2 ** o, seed + 17 * o) * 2 - 1); v = v + amp * n * n; tot += amp; amp *= 0.5
    return v / tot
def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)
def gauss(lon, lat, cx, cy, sx, sy):
    return np.exp(-(((lon - cx) / sx) ** 2 + ((lat - cy) / sy) ** 2))
def dist_to_polyline(lon, lat, pts):
    d = np.full(lon.shape, 1e9)
    for (x1, y1), (x2, y2) in zip(pts, pts[1:]):
        ax, ay = (x1 - LONC) * KX, y1; bx, by = (x2 - LONC) * KX, y2
        px, py = (lon - LONC) * KX, lat
        vx, vy = bx - ax, by - ay
        t = np.clip(((px - ax) * vx + (py - ay) * vy) / (vx * vx + vy * vy), 0, 1)
        d = np.minimum(d, np.hypot(px - (ax + t * vx), py - (ay + t * vy)))
    return d

def heights(lon, lat):
    """大地势（macro）+ 崎岖度（rugged）× 山脊噪声，再叠加河谷下切。数值单位为“示意高度”。"""
    west = smooth(104.2, 100.8, lon)
    macro = 0.35 + 0.25 * smooth(110, 114, lon)                       # 东南丘陵略起
    macro += 1.25 * west                                               # 西部高原
    macro += 0.55 * gauss(lon, lat, 106.5, 26.3, 2.6, 1.9)             # 云贵高原
    basin = gauss(lon, lat, 105.7, 30.3, 1.7, 1.25)
    macro -= 0.40 * basin                                              # 四川盆地
    loess = smooth(34.6, 35.6, lat) * gauss(lon, lat, 107.8, 37.0, 3.6, 3.0)
    macro += 0.75 * loess                                              # 黄土高原
    qinling = gauss(lon, lat, 108.5, 33.6 + 0.25 * np.sin(lon * 1.3), 4.0, 0.55)
    macro += 0.55 * qinling
    macro += 0.35 * gauss(lon, lat, 106.25, 35.7, 0.45, 1.0)           # 六盘山
    macro += 0.85 * gauss(lon, lat, 102.75, 30.8, 0.30, 0.26)          # 夹金山
    macro += 0.30 * gauss(lon, lat, 106.9, 28.15, 0.8, 0.13)           # 娄山关山脊
    marsh = gauss(lon, lat, 102.95, 33.15, 0.85, 0.7)

    rugged = 0.05
    rugged += 1.05 * gauss(lon, lat, 101.3, 29.3, 1.9, 3.8)            # 横断山
    rugged += 0.75 * gauss(lon, lat, 104.0, 33.0, 0.8, 1.3)            # 岷山
    rugged += 0.45 * qinling + 0.25 * gauss(lon, lat, 106.5, 26.3, 2.6, 1.9)
    rugged -= 0.2 * basin
    rugged = np.maximum(rugged, 0.06) * (1 - 0.92 * marsh)
    hengduan = gauss(lon, lat, 101.3, 29.3, 1.9, 3.8)
    # 横断山的山脊拉成南北向
    rx, ry = lon, lat * (1 - 0.45 * hengduan)
    ridges = ridged(rx, ry, 1.6, 5, 23)
    hills = fbm(lon, lat, 0.8, 3, 7)
    east = smooth(106.5, 109.5, lon) * (1 - loess)
    h = macro + rugged * (ridges - 0.35) * 1.5 + 0.05 * fbm(lon, lat, 3.0, 4, 5)
    h += east * (0.38 * (hills - 0.5) + 0.05 * ridged(lon, lat, 2.0, 2, 91))   # 东南丘陵：平缓起伏
    # 黄土沟壑
    h += 0.22 * loess * (ridged(lon, lat, 6.0, 3, 77) - 0.55)
    # 草地：高而平
    h = h * (1 - 0.8 * marsh) + (1.25 + 0.03 * fbm(lon, lat, 6, 2, 61)) * 0.8 * marsh
    # 河谷：随当地起伏下切，形成峡谷
    river_mask = np.zeros(lon.shape)
    for name, (pts, w, depth) in RIVERS.items():
        d = dist_to_polyline(lon, lat, pts)
        valley = np.exp(-(d / (w * 3.2)) ** 2)
        h -= depth * 0.9 * valley * np.clip(h - 0.15, 0, 3) * 0.8 + 0.06 * valley
        river_mask = np.maximum(river_mask, np.exp(-(d / (w * 0.6)) ** 2))
    h -= 0.45 * gauss(lon, lat, 103.8, 34.1, 0.10, 0.30) * np.clip(h, 0, 3)   # 腊子口峡口
    # 沙盘边缘收拢
    x, y = to_xy(lon, lat)
    edge = np.minimum(HALF_W - np.abs(x), HALF_H - np.abs(y))
    h = h * smooth(0.0, 0.22, edge) + 0.03
    return np.maximum(h, 0.03), river_mask, marsh, loess

def hex2rgb(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)])
def srgb_to_linear(c):
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)

def colors(h, river, marsh, loess, lon, lat):
    low, mid, high, rock, snow = map(hex2rgb, ['#e4dabd', '#d6bb93', '#b78a63', '#8b6148', '#fbf8f4'])
    t1 = np.clip((h - 0.3) / 0.6, 0, 1)[..., None]; c = low * (1 - t1) + mid * t1
    t2 = np.clip((h - 0.9) / 0.7, 0, 1)[..., None]; c = c * (1 - t2) + high * t2
    t3 = np.clip((h - 1.6) / 0.5, 0, 1)[..., None]; c = c * (1 - t3) + rock * t3
    t4 = np.clip((h - 2.15) / 0.25, 0, 1)[..., None]; c = c * (1 - t4) + snow * t4
    snowcap = np.clip(gauss(lon, lat, 102.75, 30.8, 0.24, 0.22) * 1.6, 0, 1)[..., None]
    c = c * (1 - snowcap) + snow * snowcap
    bs = gauss(lon, lat, 105.7, 30.3, 1.6, 1.15)[..., None] * 0.55
    c = c * (1 - bs) + hex2rgb('#d3cfa8') * bs
    lo = (loess * smooth(0.6, 1.0, h))[..., None] * 0.6
    c = c * (1 - lo) + hex2rgb('#e3c27e') * lo
    mm = np.clip(marsh * 1.2, 0, 1)[..., None] * 0.8
    c = c * (1 - mm) + hex2rgb('#8e8b62') * mm
    pud = (fbm(lon, lat, 10, 2, 99) > 0.6).astype(float)[..., None] * np.clip(marsh * 1.3, 0, 1)[..., None]
    c = c * (1 - pud * 0.85) + hex2rgb('#7d96a0') * pud * 0.85
    rv = np.clip(river, 0, 1)[..., None] * 0.85
    c = c * (1 - rv) + hex2rgb('#6d8a98') * rv
    return srgb_to_linear(c)

# —— 场景 ——
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = SAMPLES
scene.cycles.use_denoising = True
scene.render.resolution_x, scene.render.resolution_y = IMG_W, IMG_H
scene.render.film_transparent = False
scene.view_settings.view_transform = 'Standard'

bpy.ops.mesh.primitive_grid_add(x_subdivisions=RES, y_subdivisions=int(RES * HALF_H / HALF_W), size=1)
terrain = bpy.context.active_object
terrain.name = 'Terrain'
terrain.scale = (HALF_W * 2, HALF_H * 2, 1)
bpy.ops.object.transform_apply(scale=True)
me = terrain.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
lon = co[:, 0] / KX + LONC; lat = co[:, 1] + LATC
H, river, marsh, loess = heights(lon, lat)
EXAG = 0.75
co[:, 2] = H * EXAG
me.vertices.foreach_set('co', co.ravel())
me.update()
col = colors(H, river, marsh, loess, lon, lat)
attr = me.color_attributes.new(name='Col', type='FLOAT_COLOR', domain='POINT')
rgba = np.concatenate([col, np.ones((n, 1))], axis=1)
attr.data.foreach_set('color', rgba.ravel())
for p in me.polygons: p.use_smooth = True

mat = bpy.data.materials.new('TerrainMat'); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes['Principled BSDF']
ca = nt.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Col'
nt.links.new(ca.outputs['Color'], bsdf.inputs['Base Color'])
bsdf.inputs['Roughness'].default_value = 0.92
terrain.data.materials.append(mat)

# 沙盘底座
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, -0.28))
base = bpy.context.active_object
base.scale = (HALF_W * 2 + 0.002, HALF_H * 2 + 0.002, 0.56)
bm = bpy.data.materials.new('BaseMat'); bm.use_nodes = True
bm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (*srgb_to_linear(hex2rgb('#a5482f')), 1)
bm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 0.7
base.data.materials.append(bm)

# 白色桌面
bpy.ops.mesh.primitive_plane_add(size=80, location=(0, 0, -0.56))
floor = bpy.context.active_object
fm = bpy.data.materials.new('FloorMat'); fm.use_nodes = True
fm.node_tree.nodes['Principled BSDF'].inputs['Base Color'].default_value = (0.93, 0.91, 0.89, 1)
fm.node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value = 1.0
floor.data.materials.append(fm)

# 世界光：偏暖、偏暗，突出斜阳
world = bpy.data.worlds.new('World'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.95, 0.92, 0.88, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = 0.35

# 低角度斜阳（自西北）
bpy.ops.object.light_add(type='SUN', location=(0, 0, 10))
sun = bpy.context.active_object
sun.data.energy = 4.2
sun.data.angle = math.radians(2.5)
sun.data.color = (1.0, 0.93, 0.84)
sun.rotation_euler = (math.radians(70), 0, math.radians(-125))

# 相机：自南向北斜俯，整个沙盘入画
bpy.ops.object.camera_add(location=(0.0, -14.9, 14.6))
cam = bpy.context.active_object
cam.data.lens = 31
target = mathutils.Vector((0.0, 0.2, 0.0))
cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()
scene.camera = cam
bpy.context.view_layer.update()

os.makedirs(os.path.dirname(OUT_IMG), exist_ok=True)
scene.render.image_settings.file_format = 'WEBP'
scene.render.image_settings.quality = 82
scene.render.image_settings.color_mode = 'RGB'
scene.render.filepath = OUT_IMG

# —— 投影坐标 ——
def height_at(lo, la):
    hh, *_ = heights(np.array([lo]), np.array([la])); return float(hh[0]) * EXAG
def project(lo, la, lift=0.04):
    x, y = to_xy(lo, la)
    v = world_to_camera_view(scene, cam, mathutils.Vector((x, y, height_at(lo, la) + lift)))
    return [round(v.x * 100, 2), round((1 - v.y) * 100, 2)]

layout = {
    'note': '地形示意，非精确地图；坐标为图上百分比位置。由 scripts/map/build_map.py 生成。',
    'width': IMG_W, 'height': IMG_H,
    'nodes': {k: project(*v) for k, v in NODES.items()},
    'route': [],
    'labels': [{'text': t, 'kind': k, 'at': project(lo, la, 0.02)} for t, lo, la, k in LABELS],
}
for a, b in zip(ROUTE, ROUTE[1:]):
    (x1, y1), (x2, y2) = NODES[a], NODES[b]
    steps = max(6, int(math.hypot(x2 - x1, y2 - y1) * 6))
    for i in range(steps + (1 if b == ROUTE[-1] else 0)):
        t = i / steps
        layout['route'].append(project(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, 0.03))
with open(OUT_JSON, 'w', encoding='utf-8') as f:
    json.dump(layout, f, ensure_ascii=False, indent=1)

if '--no-render' not in sys.argv:
    bpy.ops.render.render(write_still=True)
print('done', OUT_IMG, OUT_JSON)
