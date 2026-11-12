import sys,re,html,urllib.request
from urllib.parse import urljoin
sys.stdout.reconfigure(encoding='utf-8')
url=sys.argv[1]; n=int(sys.argv[2]) if len(sys.argv)>2 else 30; pat=sys.argv[3] if len(sys.argv)>3 else ''
try:
    req=urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36','Accept-Language':'en-US,en'})
    raw=urllib.request.urlopen(req,timeout=25).read().decode('utf-8','replace')
except Exception as e:
    print('FETCH FAILED',e); sys.exit()
seen=set(); out=0
for m in re.finditer(r'(?is)<a\b[^>]*href="([^"#]+)"[^>]*>(.*?)</a>',raw):
    t=re.sub(r'\s+',' ',html.unescape(re.sub(r'(?s)<[^>]+>',' ',m.group(2)))).strip()
    h=urljoin(url,m.group(1))
    if len(t)<32 or h in seen or (pat and not re.search(pat,h+t,re.I)): continue
    seen.add(h); print('-',t[:150],'|',h); out+=1
    if out>=n: break
