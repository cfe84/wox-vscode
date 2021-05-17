import { Logger } from "./woxlib/Logger";
import { IWoxQueryHandler } from "./woxlib/IWoxQueryHandler";
import { JsonRPCAction } from "./woxlib/JsonRPCAction";
import { Result } from "./woxlib/Result";
import { Project } from "./Project";
import * as child_process from "child_process";
import * as path from "path";
import * as fs from "fs";
import * as url from "url";

interface OpenFolderInfo {
  folderUri: string;
}

interface CodeConfig {
  openedPathsList: {
    entries: OpenFolderInfo[];
  };
}

export class WoxCodeHandler implements IWoxQueryHandler {
  private projects: Project[];
  constructor(private logger: Logger) {
    const codeStorage = path.join(
      process.env.APPDATA as string,
      "Code",
      "storage.json"
    );
    const file = fs.readFileSync(codeStorage).toString();
    const codeConfig: CodeConfig = JSON.parse(file);
    if (!codeConfig?.openedPathsList?.entries) {
      logger.log(`Config file is incorrect`);
    }
    this.projects = codeConfig.openedPathsList.entries
      .map((entry) => {
        if (!entry.folderUri) {
          return null;
        }
        try {
          const p = url.fileURLToPath(entry.folderUri);
          if (!p) {
            return null;
          }
          const splat = p.split("/");
          return {
            name: splat[splat.length - 1],
            path: p,
          };
        } catch (err) {
          return null;
        }
      })
      .filter((entry) => entry !== null) as Project[];
  }

  search(term: string): Project[] {
    term = term.toLowerCase();
    return this.projects.filter(
      (project) => project.name.toLowerCase().indexOf(term) >= 0
    );
  }

  async processAsync(rpcAction: JsonRPCAction): Promise<Result> {
    if (rpcAction.method === "query") {
      const word = rpcAction.parameters.join(" ");
      const results = this.search(word).map((res) => ({
        IcoPath: "app.png",
        JsonRPCAction: {
          method: "openProject",
          parameters: [res.path],
        },
        Subtitle: `Open recent workspace ${res.path}`,
        Title: res.name,
      }));

      return {
        result: results,
      };
    } else if (rpcAction.method === "openProject") {
      this.logger.log(`Opening workspace ${rpcAction.parameters[0]}`);
      child_process.exec(`code ${rpcAction.parameters[0]}`);
    } else {
      this.logger.log(JSON.stringify(rpcAction));
    }
    return {
      result: [],
    };
  }
}
