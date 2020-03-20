const express = require("express");
const mysql = require('mysql');

const PORT = 1234;
const app = express();

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

app.get("/addWord", (request, response) => {
	console.log(request.query.word);
	addWord_toTable(request.query.word);
	response.send("yoyo");
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