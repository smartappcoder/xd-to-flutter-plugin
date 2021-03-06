/*
Copyright 2020 Adobe
All Rights Reserved.

NOTICE: Adobe permits you to use, modify, and distribute this file in
accordance with the terms of the Adobe license agreement accompanying
it. If you have received this file from a source other than Adobe,
then your use, modification, or distribution of it requires the prior
written permission of Adobe. 
*/

const $ = require("../../utils/utils");
const { getTransformedNode } = require("../serialize/layout");

class Grid {
	constructor(xdNode) {
		this.xdNode = xdNode;
		this.children = [];
		this.diff = null;
		this.childParameters = {};
	}

	toString(serializer, ctx) {
		let o = this.xdNode;
		let width = o.width, height = o.height;
		let xSpacing = Math.max(0, o.paddingX), ySpacing = Math.max(0, o.paddingY);
		let aspectRatio = $.fix(o.cellSize.width / o.cellSize.height, 4);
		let columnCount = o.numColumns, rowCount = o.numRows;
		let gridWidth = o.cellSize.width * columnCount + xSpacing * (columnCount - 1);
		let gridHeight = o.cellSize.height * rowCount + ySpacing * (rowCount - 1);
		let child = getTransformedNode(this.children[0], serializer, ctx);
		let childrenData = [];
		let grabChildrenData = (node, data) => {
			if (node.parameters) {
				let childParams = Object.values(this.childParameters);
				let params = Object.values(node.parameters);
				// Find matching params
				for (let paramRef of params) {
					for (let childParamRef of childParams) {
						if (paramRef.name === childParamRef.name) {
							data[paramRef.name] = paramRef;
							break;
						}
					}
				}
			}
			if (node.children) {
				for (let child of node.children) {
					grabChildrenData(child, data);
				}
			}
		};

		for (let i = 0; i < this.children.length; ++i) {
			let data = {};
			grabChildrenData(this.children[i], data);
			childrenData.push(data);
		}

		let childData = '';
		for (let i = 0; i < this.children.length; ++i) {
			childData += `{ `;
			for (let [k, v] of Object.entries(childrenData[i])) {
				childData += `'${k}': ${serializer.serializeParameterValue(v.parameter.owner.xdNode, v.parameter.value, ctx)}, `;
			}
			childData += `}, `;
		}

		let parameterLocals = ``;
		for (let paramRef of Object.values(this.childParameters)) {
			let name = paramRef.name;
			parameterLocals += `final ${name} = map['${name}'];`;
		}

		if (o.paddingX < 0 || o.paddingY < 0) { ctx.log.warn("Negative grid spacing is not supported.", o);  }
		return 'SpecificRectClip(' +
			`rect: Rect.fromLTWH(0, 0, ${width}, ${height}), ` +
			'child: UnconstrainedBox(' +
				'alignment: Alignment.topLeft, ' +
				'child: Container(' +
					`width: ${gridWidth}, height: ${gridHeight}, ` +
					'child: GridView.count(' +
						'primary: false, padding: EdgeInsets.all(0), ' +
						`mainAxisSpacing: ${ySpacing}, crossAxisSpacing: ${xSpacing}, ` +
						`crossAxisCount: ${columnCount}, childAspectRatio: ${aspectRatio}, ` +
						`children: [${childData}].map((map) { ${parameterLocals} return ${child}; }).toList(),` +
					'), ' +
				'), ' +
			'), ' +
		')';
	}
}
exports.Grid = Grid;
