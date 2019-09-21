import * as vscode from "vscode";

export const RScriptOutputChannel = {
    channel: vscode.window.createOutputChannel("RScriptRunner"),

    start(message: string) {
        this.channel.appendLine(`[Starting] ${message}`);
    },

    end(message: string) {
        this.channel.appendLine(`[Done] ${message}`);
    },

    warning(message: string) {
        this.channel.appendLine(`[Warning] ${message}`);
    },

    error(message: string) {
        this.channel.appendLine(`[Error] ${message}`);
    },

    info(message: string) {
        this.channel.appendLine(message);
    },

    show() {
        this.channel.show();
    },

    hide() {
        this.channel.hide();
    },
};
