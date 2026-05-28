const assert = require('assert');

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
const vscode = require('vscode');
const jsonToModel = require('../../scr/json-to-model');

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Generated list models guard against already parsed instances', () => {
		const result = jsonToModel._test.parseObject({
			list: [
				{
					id: 1
				}
			]
		}, 'RootModel');

		assert.ok(result.includes('factory ListModel.fromJson(dynamic json)'));
		assert.ok(result.includes('if (json is ListModel)'));
		assert.ok(result.includes('void _fromJson(Map json)'));
		assert.ok(result.includes('list.add(ListModel.fromJson(item))'));
	});
});
