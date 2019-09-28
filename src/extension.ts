import * as vscode from 'vscode';
import * as path from "path";
import * as fs from 'fs';
import * as ncp from 'copy-paste';

import { RScriptRunner } from './rScriptRunner';
import { RScriptOutputChannel } from './outputChannel';

let statusBarItem: vscode.StatusBarItem;

export function activate(context: vscode.ExtensionContext) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);

    context.subscriptions.push(
        vscode.commands.registerCommand('vsrrunner.runRScript', () => {
            runRScript();
        })
    );

    context.subscriptions.push(
        vscode.commands.registerTextEditorCommand('vsrrunner.switchToSource', () => {
            switchSourceAndOutput();
        })
    );
}

// method called when the extension is deactivated
export function deactivate() { }

async function runRScript(): Promise<void> {
    let rScriptRunner = new RScriptRunner();

    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
        vscode.window.showInformationMessage(`Error: no R script file in active editor window.`);
        return;
    }

    const wad = activeTextEditor.document;
    const filePath = wad.fileName;
    const viewColumn = vscode.window.activeTextEditor.viewColumn;
    await wad.save();

    try {
        rScriptRunner.getPathRScript();
    } catch (error) {
        let msg = error.message;
        RScriptOutputChannel.error(msg);
        vscode.window.showErrorMessage(msg);
        return;
    }

    const basename = path.basename(filePath, path.extname(filePath));
    const outPath = path.join(path.dirname(filePath), basename + ".Rout");

    if (rScriptRunner.isRunning()) {
        let msg = `R still running, cannot start another task.`;
        RScriptOutputChannel.error(msg);
        vscode.window.showErrorMessage(msg);
        return;
    }
    RScriptOutputChannel.start(`Running R script "${filePath}".`);

    let timerStart = Date.now();
    vscode.window
        .withProgress({
            location: vscode.ProgressLocation.Notification,
            title: `Running R script "${path.basename(filePath)}".`,
            cancellable: true
        }, (progress, token) => {
            statusBarItem.text = `Running R script...`;
            statusBarItem.show();
            token.onCancellationRequested(() => {
                rScriptRunner.abortRun();
            });
            return rScriptRunner.runRScript(filePath, outPath);
        })
        .then(
            () => {
                statusBarItem.hide();
                let timerStop = Date.now();
                let msg = `Finished running R script! Duration: ${msToHMS(timerStop - timerStart)}.`;
                RScriptOutputChannel.end(msg);
                vscode.window.showInformationMessage(msg);
                if (fs.existsSync(outPath)) {
                    openOutputFile(outPath, viewColumn);
                }
            },
            (error) => {
                statusBarItem.hide();
                RScriptOutputChannel.error(error);
                vscode.window.showErrorMessage(error);
                if (fs.existsSync(outPath)) {
                    openOutputFile(outPath, viewColumn);
                }
            }
        );
}

async function switchSourceAndOutput(): Promise<void> {
    const activeTextEditor = vscode.window.activeTextEditor;
    if (!activeTextEditor) {
        return;
    }
    const wad = activeTextEditor.document;

    let currentIsOutput = path.extname(wad.fileName).toLowerCase() === '.rout';
    const basename = path.basename(wad.fileName, path.extname(wad.fileName));

    const switchToFilePath = path.join(path.dirname(wad.fileName), basename + (currentIsOutput ? ".R" : ".Rout"));
    let switchToFileBase = path.basename(switchToFilePath);
    let sourceDoc = vscode.workspace.textDocuments.find(doc => path.parse(doc.fileName).base.toLowerCase() === switchToFileBase.toLowerCase());
    if (sourceDoc !== null && sourceDoc !== undefined) {
        let sourceTextEditor = vscode.window.visibleTextEditors.find(r => r.document === sourceDoc);
        if (sourceTextEditor === undefined) {
            await vscode.window.showTextDocument(sourceDoc, { preview: true, viewColumn: activeTextEditor.viewColumn, preserveFocus: false });
        } else {
            await vscode.window.showTextDocument(sourceDoc, { preview: true, viewColumn: sourceTextEditor.viewColumn, preserveFocus: false });
        }
    } else if (fs.existsSync(switchToFilePath)) {
        vscode.workspace.openTextDocument(switchToFilePath).then(doc => {
            vscode.window.showTextDocument(doc);
         });
    } else {
        vscode.window.showErrorMessage(`Error: source file not found for this R output file.`);
    }
}

async function openOutputFile(fileName: string, sourceViewColumn: vscode.ViewColumn): Promise<void> {
    const basename = path.basename(fileName);
    const unique = (value, index, self) => { return self.indexOf(value) === index; };
    let viewColumns = vscode.window.visibleTextEditors.map(r => r.viewColumn).filter(unique);
    if (viewColumns.length > 1) {
        let vc = viewColumns.some(r => r > sourceViewColumn) ? viewColumns.find(r => r > sourceViewColumn) : sourceViewColumn - 1;
        await vscode.workspace.openTextDocument(fileName).then(doc => {
            vscode.window.showTextDocument(doc, { preview: false, viewColumn: vc, preserveFocus: false });
        });
    } else {
        await vscode.workspace.openTextDocument(fileName).then(doc => {
            vscode.window.showTextDocument(doc, { preview: false, viewColumn: viewColumns[0], preserveFocus: false });
        });
    }
}

function msToHMS(ms : number): string {
    let seconds = ms / 1000;
    let hours = Math.trunc(seconds / 3600);
    seconds = seconds % 3600;
    let minutes = Math.trunc(seconds / 60);
    seconds = seconds % 60;
    return hours + ":" + minutes + ":" + seconds;
}
