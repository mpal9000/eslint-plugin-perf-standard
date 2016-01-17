'use strict';

module.exports = noInstanceofGuard;

function noInstanceofGuard(context) {
    return {
        'FunctionExpression': function checkExpr(node) {
            checkForOnelineClosure(node);
        },
        'FunctionDeclaration': function checkDecl(node) {
            checkForOnelineClosure(node);
        }
    };

    /*eslint max-statements: [2, 40]*/
    function checkForOnelineClosure(node) {
        var parent = findParent(node, [
            'FunctionDeclaration',
            'FunctionExpression'
        ]);
        if (!parent) {
            return null;
        }

        var funcBody = node.body;
        if (funcBody.type !== 'BlockStatement') {
            return context.report(node, 'unexpected weird closure');
        }

        var statements = funcBody.body;
        if (statements.length > 1) {
            return context.report(node, 'expected oneline closure');
        }

        var expr = statements[0];
        if (expr.type !== 'ExpressionStatement') {
            return context.report(
                node, 'expected a single expression in closure'
            );
        }

        var call = expr.expression;
        if (call.type !== 'CallExpression') {
            return context.report(
                node, 'expected a call expression in closure'
            );
        }

        var callee = call.callee;
        if (callee.type !== 'MemberExpression') {
            return context.report(
                node, 'expected a method call in closure'
            );
        }

        if (callee.object.name !== 'self') {
            return context.report(
                node, 'expected method call to be on `self`'
            );
        }

        var methodCallArgs = call.arguments;
        var funcArgs = node.params;

        var funcArgsIdentifiers = {};
        for (var i = 0; i < funcArgs.length; i++) {
            funcArgsIdentifiers[funcArgs[i].name] = true;
        }

        for (var j = 0; j < methodCallArgs.length; j++) {
            var identifier = methodCallArgs[j];
            if (!funcArgsIdentifiers[identifier.name]) {
                context.report(
                    identifier,
                    'expected closure to only close over `self`.'
                );
            }
        }
    }
}

module.exports.schema = [];

function findParent(node, types) {
    var parent = node;
    var candidate = null;

    while (parent && parent.parent) {
        parent = parent.parent;

        if (types.indexOf(parent.type) >= 0) {
            candidate = parent;
            break;
        }
    }

    return candidate;
}