import sys,re,html,urllib.request
sys.stdout.reconfigure(encoding="utf-8")
url=sys.argv[1]; start=int(sys.argv[2]) if len(sys.argv)>2 else 0; n=int(sys.argv[3]) if len(sys.argv)>3 else 6000
kw=sys.argv[4] if len(sys.argv)>4 else None
try:
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36','Accept-Language':'en-US,en'})
    raw=urllib.request.urlopen(req,timeout=25).read().decode('utf-8','replace')
except Exception as e:
    print('FETCH FAILED',e); sys.exit()
raw=re.sub(r'(?is)<(script|style|noscript|svg|nav|footer|header)[^>]*>.*?</\1>',' ',raw)
t=html.unescape(re.sub(r'(?s)<[^>]+>',' ',raw)); t=re.sub(r'\s+',' ',t)
if kw:
    i=t.find(kw); start=max(0,i-200) if i>=0 else start
print(len(t),'chars |',t[start:start+n])
