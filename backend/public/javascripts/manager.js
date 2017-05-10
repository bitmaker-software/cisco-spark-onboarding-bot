$(function () {
  $('#save-bot-token').click(function () {
    var token = $('#bot-token').val();
    $.post('/manager/api/saveToken', {token: token}, function (data) {
      $('#results').html(data);
    });
  });
});