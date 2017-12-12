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

def getPostDescription(userID, posterID, tagsArray, friendsArray):

    userName = ""
    friendNames = ""
    strangerNames = ""

    try:
        #Sort tagsArray, friends first then strangers
        taggedFriends = []
        taggedStrangers = []
        for tag in tagsArray:
            if tag in friendsArray:
                #taggedFriends.append(tag.name)
                taggedFriends.append(tag)
            elif tag != userID:
                #taggedStrangers.append(tag.name)
                taggedStrangers.append(tag)
        taggedNames = taggedFriends + taggedStrangers

        tagCount = len(taggedNames)
        tagsLeft = tagCount - len(taggedNames[:4])
        print tagCount
        #If user is poster
        if userID == posterID: 
            stranger = False
            author = True
            if tagCount < 5:
                if tagCount == 1:
                    postDescription = "You tagged " + taggedNames[0]
                elif tagCount == 2:
                    postDescription = "You tagged " + (" and ").join(taggedNames)
                else:
                    postDescription = "You tagged " + (', ').join(taggedNames[:-1]) + ' and ' + taggedNames[-1]
            else:
                postDescription = "You tagged " + (', ').join(taggedNames[:4]) + " and " +str(tagsLeft)+ " other people"

        #If poster is user's friend
        elif posterID in friendsArray:
            stranger = False
            author = False
            if userID in tagsArray:
                taggedNames.insert(0, "you")
                tagCount += 1
                tagsLeft += 1
            if tagCount < 5:
                if tagCount == 1:
                    postDescription = posterID +" tagged "+ taggedNames[0]
                elif tagCount == 2:
                    postDescription = posterID + " tagged " + (" and ").join(taggedNames)
                else:
                    postDescription = posterID + " tagged " + (', ').join(taggedNames[:-1]) + ' and ' + taggedNames[-1]
            else:
                postDescription = posterID + " tagged " + (', ').join(taggedNames[:4]) + ' and ' + str(tagsLeft) + " other people"
        #If poster is stranger to user
        else:
            stranger = True
            author = False
            if userID in tagsArray:
                taggedNames.insert(0, "You")
                tagCount += 1
                tagsLeft += 1
            if tagCount < 5:
                if taggedNames[0] == "You" and tagCount == 1:
                    postDescription = "You were tagged by "+posterID  
                elif tagCount == 1:
                    postDescription = taggedNames[0] +" was tagged by "+posterID
                elif tagCount == 2:
                    postDescription = (" and ").join(taggedNames) + " were tagged by " + posterID 
                else:
                    postDescription = (', ').join(taggedNames[:-1]) + ' and ' + taggedNames[-1]+ " were tagged by " + posterID
            else:
                postDescription = (', ').join(taggedNames[:4]) + ' and ' + str(tagsLeft)+ " other people were tagged by " + posterID

        otherPeople = taggedNames[4:]
        return [postDescription, otherPeople, stranger, author]

    except:
        return [posterID +" commented on a page", "error"]

# juan = "Juan Ordonez"
# josh = "Josh Goldman"
# alex = "Alex Zekoff"
# clay = "Clay Anthony"
# gagan = "Gagan Mac"
# michael = "Michael Chai"
# hannah = "Hannah Chi"
# tucker = "Tucker Smith"
# anne = "Anne Flan"
# brad = "Brad Pitt"

# getPostDescription(juan, hannah, [alex, tucker, anne, brad, clay, gagan], [josh, alex, clay, gagan, michael])


# Converts a string in datetime object format (YYYY-MM-DD 00:00:00.000000) 
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