import json,urllib.request,os,sys,concurrent.futures as cf
UA={'User-Agent':'Mozilla/5.0 fogtest'}
def get(u): return urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read()
def one(a):
    try:
        d=json.loads(get(f"https://api.polyhaven.com/files/{a}"))['gltf']['1k']['gltf']
        base=f"web/models/{a}/"; os.makedirs(base,exist_ok=True)
        open(base+a+".gltf","wb").write(get(d['url']))
        for rel,v in d.get('include',{}).items():
            p=base+rel; os.makedirs(os.path.dirname(p),exist_ok=True); open(p,"wb").write(get(v['url']))
        return a,"ok"
    except Exception as e: return a,str(e)
with cf.ThreadPoolExecutor(8) as ex:
    for r in ex.map(one,sys.argv[1:]): print(*r)
