import requests
import urllib
from BeautifulSoup import BeautifulSoup, SoupStrainer
import lxml.html

"""For a given URL, retrieve HTML and look for potential canonical URL. 
   Returns canonical URL if found, or regular URL otherwise"""
def canonical(url):
	try: 
		#Get HTML of url
		page = urllib.urlopen(url).read()
		#Find canonical URL
		links = lxml.html.fromstring(page).find("head").findall("link")
		canonicalUrl = [link.attrib['href'] for link in links if "canonical" in lxml.html.tostring(link)][0]
		return canonicalUrl

	except Exception as e:
		print e
		return url
