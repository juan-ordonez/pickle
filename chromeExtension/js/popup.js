//Scroll to bottom of chat page each time popup is opened
$(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);

//Autosize textarea for new comments
autosize(document.querySelectorAll('#newComment'));
//Scroll to bottom of page after each textarea resize
$('#newComment').each(function(){
  autosize(this);
}).on('autosize:resized', function(){
  $(".containerComments").scrollTop($(".containerComments")[0].scrollHeight);
});


