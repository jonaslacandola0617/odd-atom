import sys, numpy as np
from PIL import Image
a = np.array(Image.open(sys.argv[1]).convert('RGB')).astype(int)
lum = a.mean(2)
def probe(x0, x1, y0, y1, name):
    c = lum[y0:y1, x0:x1]; dark = c < 75
    # rows with a long dark horizontal run
    best = []
    for y in range(c.shape[0]):
        r = dark[y]; run = m = 0
        for v in r:
            run = run + 1 if v else 0; m = max(m, run)
        best.append(m)
    best = np.array(best)
    print(name, 'rows with run>=%d:' % (0.12 * (x1 - x0)), [(y0 + i, int(b)) for i, b in enumerate(best) if b >= 0.12 * (x1 - x0)])
probe(200, 320, 40, 110, 'front')
for i, (x0, x1) in enumerate([(27, 242), (256, 472), (486, 702), (714, 927), (940, 1153), (1165, 1386)]):
    probe(x0, x1, 750, 900, f'head{i}')
