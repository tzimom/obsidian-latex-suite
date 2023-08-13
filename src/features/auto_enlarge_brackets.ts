import { getEquationBounds, findMatchingBracket } from "src/editor_helpers";
import { queueSnippet } from "src/snippets/snippet_queue_state_field";
import { expandSnippets } from "src/snippets/snippet_management";
import { Context } from "src/snippets/context";
import { getLatexSuiteConfigFromView } from "src/snippets/config";


export const autoEnlargeBrackets = (ctx: Context) => {
	const settings = getLatexSuiteConfigFromView(ctx.view);
	if (!settings.basicSettings.autoEnlargeBrackets) return;

	const result = getEquationBounds(ctx.view.state);
	if (!result) return false;
	const {start, end} = result;

	const text = ctx.view.state.doc.toString();
	const left = "\\left";
	const right = "\\right";


	for (let i = start; i < end; i++) {

		const brackets:{[open: string]: string} = {"(": ")", "[": "]", "\\{": "\\}", "\\langle": "\\rangle", "\\lvert": "\\rvert"};
		const openBrackets = Object.keys(brackets);
		let found = false;
		let open = "";

		for (const openBracket of openBrackets) {
			if (text.slice(i, i + openBracket.length) === openBracket) {
				found = true;
				open = openBracket;
				break;
			}
		}

		if (!found) continue;
		const bracketSize = open.length;
		const close = brackets[open];


		const j = findMatchingBracket(text, i, open, close, false, end);
		if (j === -1) continue;


		// If \left and \right already inserted, ignore
		if ((text.slice(i-left.length, i) === left) && (text.slice(j-right.length, j) === right)) continue;


		// Check whether the brackets contain sum, int or frac
		const bracketContents = text.slice(i+1, j);
		const containsTrigger = settings.parsedSettings.autoEnlargeBracketsTriggers.some(word => bracketContents.contains("\\" + word));

		if (!containsTrigger) {
			i = j;
			continue;
		}

		// Enlarge the brackets
		queueSnippet(ctx.view, {from: i, to: i+bracketSize, insert: left + open + " "});
		queueSnippet(ctx.view, {from: j, to: j+bracketSize, insert: " " + right + close});
	}

	expandSnippets(ctx.view);
}
