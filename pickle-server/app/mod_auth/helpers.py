import requests
import urllib
from BeautifulSoup import BeautifulSoup

"""For a given URL, retrieve HTML and look for potential canonical URL. 
   Returns canonical URL if found, or regular URL otherwise"""
def canonical(url):
	try: 
		#Get HTML of url
		page = urllib.urlopen(url).read()
		
		#Find canonical URL
		soup = BeautifulSoup(page)
		canonicalUrl = soup.find(rel="canonical").get('href')
		return canonicalUrl

	except Exception as e:
		print e
		return url

