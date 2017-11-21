import metadata_parser
from datetime import datetime
from dateutil import tz

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

# Converts a datetime object (YYYY-MM-DD 00:00:00.000000) 
# into a string with proper timestamp label
def getTimeLabel(commentDatetime):
    #Convert comment datetime from utc to user's local timezone
    localTimeZone = tz.tzlocal()
    UtcTimeZone = tz.tzutc()
    commentTimeAware = datetime.strptime(commentDatetime, "%Y-%m-%d %H:%M:%S.%f")
    commentTimeAware = commentTimeAware.replace(tzinfo=UtcTimeZone)
    commentTimeAware = commentTimeAware.astimezone(localTimeZone)
    commentDatetime = str(commentTimeAware)
    #Get current datetime in [year,month,day,hour, minute] format
    currentDatetime = str(datetime.now())
    currentTime = [int(currentDatetime[0:4]), int(currentDatetime[5:7]), int(currentDatetime[8:10]), int(currentDatetime[11:13]), int(currentDatetime[14:16])]
    #Get comment datetime in [year, month,day,hour, minute] format
    commentTime = [int(commentDatetime[0:4]), int(commentDatetime[5:7]), int(commentDatetime[8:10]), int(commentDatetime[11:13]), int(commentDatetime[14:16])]

    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    #Format time string
    if currentTime[0] == commentTime[0] and currentTime[1] == commentTime[1] and currentTime[2] == commentTime[2] and currentTime[3] == commentTime[3]:
        timeDifference = currentTime[4] - commentTime[4]
        timeLabel = str(timeDifference) + " min"
    elif  currentTime[0] == commentTime[0] and currentTime[1] == commentTime[1] and currentTime[2] == commentTime[2]:
        if currentTime[4] - commentTime[4] >= 30:
            timeDifference = currentTime[3] - commentTime[3] + 1
        else:
            timeDifference = currentTime[3] - commentTime[3]
        timeLabel = str(timeDifference) + "hrs"
    elif currentTime[0] == commentTime[0]:
        if commentTime[3] <12:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) + ", " + str(commentTime[3]) + ":" + str(commentTime[4]) + " AM"
        else:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) + ", " + str(commentTime[3]-12) + ":" + str(commentTime[4]) + " PM"
    else:
        if commentTime[3] <12:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) +" "+ str(commentTime[0]) + ", " + str(commentTime[3]) + ":" + str(commentTime[4]) + " AM"
        else:
            timeLabel = str(months[commentTime[1] - 1]) +" "+ str(commentTime[2]) +" "+ str(commentTime[0]) +", " + str(commentTime[3]-12) + ":" + str(commentTime[4]) + " PM"

    return timeLabel