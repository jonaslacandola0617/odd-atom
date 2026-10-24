from pathlib import Path
import sys,json
sys.path.insert(0,str(Path('.cache/motion-study').resolve()))
import cv2,numpy as np
from PIL import Image
root=Path(__file__).resolve().parents[1];out=root/'docs/production/artwork-motion/registration-check.json'
src=cv2.imread(str(root/'assets/scenes/artwork-consistency-02/medicine-immune-defense.png'))
cut=cv2.imread(str(root/'public/assets/artwork/scene-motion/medicine-cutouts.png'),cv2.IMREAD_UNCHANGED)
sift=cv2.SIFT_create(nfeatures=3500)
record={}
for name,roi in [('clinician',(900,100,1672,941)),('plant',(0,350,370,800))]:
 x,y,X,Y=roi;mask=np.zeros(cut.shape[:2],np.uint8);mask[y:Y,x:X]=(cut[y:Y,x:X,3]>240).astype(np.uint8)*255
 targetmask=np.zeros(src.shape[:2],np.uint8);targetmask[y:Y,x:X]=255
 k,d=sift.detectAndCompute(cut[:,:,:3],mask);K,D=sift.detectAndCompute(src,targetmask)
 matches=cv2.BFMatcher().knnMatch(d,D,k=2);good=[m for m,n in matches if m.distance<.74*n.distance]
 a=np.float32([k[m.queryIdx].pt for m in good]);b=np.float32([K[m.trainIdx].pt for m in good])
 M,inliers=cv2.estimateAffinePartial2D(a,b,method=cv2.RANSAC,ransacReprojThreshold=3,maxIters=6000)
 ok=inliers[:,0].astype(bool);err=np.linalg.norm(cv2.transform(a[None],M)[0]-b,axis=1)
 record[name]={'matrix':M.tolist(),'matches':len(good),'inliers':int(sum(ok)),'median_inlier_error':float(np.median(err[ok]))}
 print(name,record[name])
# Isolate colored source shards by connected contours; this writes coordinates,
# not retouched media. Remotion uses those paths to sample approved source pixels.
cy=cv2.imread(str(root/'assets/scenes/artwork-consistency-02/cyber-network-defense.png'))
hsv=cv2.cvtColor(cy,cv2.COLOR_BGR2HSV)
mask=cv2.inRange(hsv,np.array([156,90,125]),np.array([179,255,255]));mask[:400]=0
n,labels,stats,cent=cv2.connectedComponentsWithStats(mask)
shards=[]
for i in range(1,n):
 x,y,w,h,area=stats[i]
 if 990<x<1170 and 450<y<630 and 300<area<6000:
  contours,_=cv2.findContours((labels==i).astype(np.uint8),cv2.RETR_EXTERNAL,cv2.CHAIN_APPROX_SIMPLE)
  contour=max(contours,key=cv2.contourArea);poly=cv2.approxPolyDP(contour,1,True)[:,0,:].tolist()
  shards.append({'bbox':[int(x),int(y),int(w),int(h)],'center':[float(cent[i,0]),float(cent[i,1])],'points':poly,'area':int(area)})
record['shards']=sorted(shards,key=lambda s:-s['area'])[:2]
out.write_text(json.dumps(record,indent=2)+'\n');print('shards',[(s['bbox'],s['area']) for s in record['shards']])
