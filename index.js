const express = require("express");
var cors = require('cors')
const mysql = require('mysql');
var request_API = require('request');
const path = require('path');

const PORT = 1234;
const app = express();
app.use(cors())

const connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'password',
	database: 'sitepoint'
});

connection.connect((err) => {
	if (err) throw err;
	console.log('SQL Connected!');
});

function addWord_toTable(word_tobe_searched) {
	var query_findword = "select * from poem_words where word = ?";

	connection.query(query_findword, word_tobe_searched, (err, rows) => {
		if (err) throw err;
		console.log(rows, rows.length);
		if (rows.length > 0) {
			connection.query("update poem_words SET no_of_occ = no_of_occ + 1 where word = ?", word_tobe_searched, (err, response) => {
				if (err) throw err;
				console.log(response);
			});
		}
		else if (rows.length === 0) {
			var word_tobe_added = word_tobe_searched;
			connection.query("select MAX(id) AS max from poem_words", (err, rows) => {
				if (err) throw err;
				var id = rows[0].max + 1;

				var query_addword = "insert into poem_words (id, word, no_of_occ) values (?, ?, 1)";

				connection.query(query_addword, [id, word_tobe_added], (err, response) => {
					if (err) throw err;
					console.log(response);

				});

			});
		}
	});
}

function top10_results() {
	return new Promise(function (resolve, reject) {
		connection.query('select * from poem_words order by no_of_occ desc LIMIT 10', (err, rows) => {
			if (err) {
				reject(err);
			}
			else {
				resolve(rows);
			}
		});
	});

}

app.get('/', function (req, res) {
	res.sendFile(path.join(__dirname + '/index.html'));
	//__dirname : It will resolve to your project folder.
});

app.get("/top10", (request, response) => {
	top10_results()
		.then(function (data) {
			console.log("Top 10 results are : ");
			console.log(data);	//use data[0].word for API use
			response.send(data);
		})
		.catch(function (error) {
			console.log(error);
		});
});

app.get("/autocomplete", (request, response) => {
	var search_word = request.query.word;

	var options = {
		'method': 'GET',
		'url': 'https://api.datamuse.com/sug?s=' + search_word,
		'headers': {
			'Cache-Control': 'no-cache'
		}
	};
	request_API(options, function (error, data) {
		if (error) {
			console.log(error);
		}
		else {
			response.send(data.body);
		}
	});

});

app.get("/rhymingwords", (request, response) => {
	var search_word = request.query.word.toLowerCase();
	addWord_toTable(search_word);
	var options = {
		'method': 'GET',
		'url': 'https://api.datamuse.com/words?rel_rhy=' + search_word,
		'headers': {
			'Cache-Control': 'no-cache'
		}
	};
	request_API(options, function (error, data) {
		if (error) throw new Error(error);
		response.send(data.body);
	});

});

app.listen(PORT, () => {
	console.log("Server running");
});


/*
connection.end((err) => {
  // The connection is terminated gracefully
  // Ensures all remaining queries are executed
  // Then sends a quit packet to the MySQL server.
});
*/

/*
app.get("/addWord", (request, response) => {
	console.log(request.query.word);
	addWord_toTable(request.query.word);
	response.send("word added");
});
*/