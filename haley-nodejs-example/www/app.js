
$(function(){
		
	var classifyInputTitle = $('.classify-input-title');
    var classifyInput = $('.classify-input-text');
    var classifyButton = $('.classify-button');

    var classifyResults = $('#classify-results');
	
    classifyButton.click(function(){
    var t = $.trim(classifyInputTitle.val());
	var v = $.trim(classifyInput.val());
	if(v.length == 0) return;
	
	classifyInputTitle.attr('disabled', 'disabled');
	classifyInput.attr('disabled', 'disabled');
	classifyButton.attr('disabled', 'disabled');
		
	$.post('/classify', JSON.stringify({title: t, text: v}), function(data, textStatus, jqXHR){
	    console.log('classify response', data);
			
	    classifyInputTitle.removeAttr('disabled');
	    classifyInput.removeAttr('disabled');
	    classifyButton.removeAttr('disabled');
			
	    classifyResults.empty();
			
	    if(data.ok != true) {
		console.error("Request error:" + data.message);
		classifyResults.text('ERROR ' + data.message);
		return;
	    }
			
	    if(data.results.length == 0) {
		classifyResults.text('(no classification results for text "' + v + ')"');
		return;
	    }
			
	    var table = $('<table>');
	    var head = $('<tr>').append($('<th>').text('URI'));
	    head.append($('<th>').text('Name'));
	    head.append($('<th>').text('Score'));
			
	    table.append($('<thead>').append(head));
	    var tbody = $('<tbody>');
	    
	    for( var i = 0 ; i < data.results.length; i++) {
		var category = data.results[i];
		var tr = $('<tr>');
		tr.append($('<td>').text(category.stringValue));
		tr.append($('<td>').text(category.name));
		tr.append($('<td>').text(category.score));
		tbody.append(tr);
	    }
			
	    table.append(tbody);
	    classifyResults.append(table);
	    
	}).fail(function(){
	    classifyResults.empty().text('ERROR ' + arguments[2]);
	    console.error("ERROR", arguments[2] );
	    classifyInputTitle.removeAttr('disabled');
	    classifyInput.removeAttr('disabled');
	    classifyButton.removeAttr('disabled');
	});
		
    });	
});
