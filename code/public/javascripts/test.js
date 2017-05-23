$(function () {
    $('#btn-search-user').click(() => {
        var searchString = encodeURIComponent($('#txt-search-user').val());
        $.get('/test/search_users/' + searchString, {}, res => {
            var ul = $('#lst-result-user');
            res.forEach( item => {
                ul.append('<li>' + item.displayName + ' (' + item.email + ') <input class="btn-send-flow" type="button" value="send" data-sparkid="' + item.id + '" /></li>');
            });

            $('.btn-send-flow').click(sendFlow);
        });
    });

    function sendFlow(){
        alert($(this).data('sparkid'));
    }
});