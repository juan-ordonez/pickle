import metadata_parser

"""For a given URL, retrieve HTML and look for potential canonical URL. 
   Returns canonical URL if found, or regular URL otherwise"""
def canonical(url):
	try:
		headers = {'User-Agent':'Mozilla/5.0'}
		page = metadata_parser.MetadataParser(url=url, url_headers=headers)
		canonical = page.get_metadata('canonical')

		if canonical:
			return canonical
		return url
	except:
		return url


