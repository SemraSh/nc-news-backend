process.env.NODE_ENV = 'test'
const saveTestData = require('../seed/test.seed');
const { expect } = require('chai');
const app = require('../server');
const request = require('supertest')(app);
const mongoose = require('mongoose');
mongoose.Promise = Promise;

describe('Articles Error Handling', () => {
	let data = {};
	before(() => {
		const p = mongoose.connection.readyState === 0 ? mongoose.connect(db) : Promise.resolve();
		return p
			.then(() => mongoose.connection.dropDatabase())
			.then(saveTestData)
			.then(savedData => {
				data = savedData;
				return data;
			});
	});

	it('"GET /articles" returns error if the page is not defined or invalid', () => {
		return request
			.get('/articles?page1')
			.expect(400)
			.then(res => {
				expect(res.body.error.message).to.equal('Please provide a query in the format \'page=1\'');
			});
	});

	it('"GET /articles" returns error if the total page number is lower than requested', () => {
		return request
			.get('/articles?page=6')
			.expect(404)
			.then(res => {
				expect(res.body.error.message).to.equal('Not Found!');
			});
	});

	it('"GET /articles/:article_id" returns error if the id is not valid ', () => {
		const articleId = data.articles[0]._id;
		return request
			.get(`/articles/${articleId}1`)
			.expect(400)
			.then(res => {
				expect(res.body.error.message).to.equal('Article id is not valid!');
			});
	});

	it('"PUT /articles/:article_id?vote=up" returns error if the format of the query is wrong', () => {
		const articleId = data.articles[0]._id;
		return request
			.put(`/articles/${articleId}?vote=upp`)
			.expect(400)
			.then(res => {
				expect(res.body.error.message).to.equal('Please provide a query in the format vote=up or vote=down');
			});
	});

	it('"POST /articles/:article_id/comments" returns error if article_id is not valid', () => {
		const articleId = data.articles[1]._id;
		const comment = {
			belongs_to: articleId,
			body: 'This is a test comment',
		};
		return request
			.post(`/articles/erfnweoirfj8679/comments`)
			.send(comment)
			.expect(400)
			.then(res => {
				expect(res.body.error.message).to.equal('article_id is not a valid id');
			});
	});

	it('"POST /articles/:article_id/comments" returns error if belongs_to:article_id is not the same article id as in the url', () => {
		const articleId = data.articles[1]._id;
		const comment = {
			belongs_to: 'isegfaliwuefbai',
			body: 'This is a test comment',
		};
		return request
			.post(`/articles/${articleId}/comments`)
			.send(comment)
			.expect(400)
			.then(res => {
				expect(res.body.error.message).to.equal('belongs_to:`article_id` did not match the article id in the url');
			});
	});

	it('"POST /articles/:article_id/comments" returns error if the request doensnt have required fields', () => {
		const articleId = data.articles[1]._id;
		const comment = {
			belongs_to: articleId,
			body: '',
		};
		// comment.body is empty | falsy value
		return request
			.post(`/articles/${articleId}/comments`)
			.send(comment)
			.expect(400)
			.then(res => {
				expect(res.body.error.message).to.equal('New comment should include the required properties \'belongs_to\', \'body\'');
			});
	})
});