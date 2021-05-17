import { Logger } from "./woxlib/Logger";
import { WoxCodeHandler } from "./WoxCodeHandler";
import { WoxQueryProcessor } from "./woxlib/WoxQueryProcessor";

const logger = new Logger(true);
const handler = new WoxCodeHandler(logger);
const processor = new WoxQueryProcessor(handler, logger);
processor.processFromCommandLineAsync(process.argv).then(() => {});
