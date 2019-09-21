import * as cp from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as tk from 'tree-kill';
import { window, workspace} from "vscode";

export class RScriptRunner {

    private _rScriptHook: any;
    private _isRunning: boolean = false;
    private _isAborted: boolean = false;

    constructor() {
    }

    public isRunning(): boolean {
        return this._isRunning;
    }

    public runRScript(fileIn: string, fileOut: string): Promise<void> {
        if (this._isRunning) {
            throw new Error(`R Runner still running, cannot start another task!`);
        }
        this._isRunning = true;
        this._isAborted = false;
        let pathR = this.getPathRScript();
        let workingDirectory = path.dirname(fileIn);
        this.clearOutputFile(fileOut);
        const cmd = `"${pathR}"`;
        const args = [
            `CMD BATCH`,
            `--quiet`,
            `"${fileIn}"`
        ];
        let execCmd = `${cmd} ${args.join(" ")}`;
        return new Promise<any>((resolve, reject) => {
            this._rScriptHook = cp.exec(execCmd, {cwd: workingDirectory}, (error, stdout, stderr) => {
                this._rScriptHook = null;
                this._isRunning = false;
                if (this._isAborted) {
                    return reject(`R script run cancelled`);
                }
                if (error) {
                    return reject(`R script run failed (error code ${error.code}).`);
                }
                if (stderr) {
                    return reject(`R script run failed (error code ${error.code}).`);
                }
                resolve(stdout);
            });
          });
    }

    public abortRun() {
        if (this._isRunning) {
            if (this._rScriptHook) {
                // Sending the kill signal does not work, apparently
                //this._genBatchHook.kill('SIGTERM');
                tk(this._rScriptHook.pid);
                this._isAborted = true;
            }
        }
    }

    private clearOutputFile(fileOut: string) {
        if (fs.existsSync(fileOut)) {
            fs.writeFileSync(fileOut, '');
        }
    }

    public getPathRScript(): string {
        let config = workspace.getConfiguration("r");
        let pathR = "";
        if (process.platform === "win32") {
            pathR = config.get("rterm.windows") as string;
        } else if (process.platform === "darwin") {
            pathR = config.get("rterm.mac") as string;
        } else if ( process.platform === "linux") {
            pathR = config.get("rterm.linux") as string;
        } else {
            window.showErrorMessage(process.platform + " can't use R");
            pathR = "";
        }
        //let pathRScript = path.join(path.dirname(pathR), "RTerm.exe");
        return pathR;
    }
}
