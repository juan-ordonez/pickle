import requests
import urllib2
from BeautifulSoup import BeautifulSoup

"""For a given URL, retrieve HTML and look for potential canonical URL. 
   Returns canonical URL if found, or regular URL otherwise"""
def canonical(url):
	try: 
		#Get HTML of url
		req = urllib2.Request(url)
		response = urllib2.urlopen(req)
		html = response.read()

		#Find canonical URL
		soup = BeautifulSoup(html)
		canonicalUrl = soup.find(rel="canonical").get('href')
		return canonicalUrl

	except:
		return url

