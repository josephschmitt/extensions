import { FileStructure } from "./FileStructure";
import { LINE_STRINGS } from "./line-strings";

/**
 * Represents all rendering options available
 * when calling `generateTree`
 */
export interface GenerateTreeOptions {
  /**
   * Which set of characters to use when
   * rendering directory lines
   */
  charset?: "ascii" | "utf-8";

  /**
   * Whether or not to append trailing slashes
   * to directories. Items that already include a
   * trailing slash will not have another appended.
   */
  trailingDirSlash?: boolean;

  /**
   * Whether or not to print the full
   * path of the item
   */
  fullPath?: boolean;

  /**
   * Whether or not to render a dot as the root of the tree
   */
  rootDot?: boolean;
}

/** The default options if no options are provided */
export const defaultOptions: GenerateTreeOptions = {
  charset: "utf-8",
  trailingDirSlash: false,
  fullPath: false,
  rootDot: true,
};

const flattenTree = (structure: FileStructure, options: GenerateTreeOptions): Array<string | null> => {
  let lines: Array<string | null> = [getAsciiLine(structure, options)];
  for (const child of structure.children) {
    lines = lines.concat(flattenTree(child, options));
  }
  return lines;
};

/**
 * Generates an ASCII tree diagram, given a FileStructure
 * @param structure The FileStructure object to convert into ASCII
 * @param options The rendering options
 */
export const generateTree = (structure: FileStructure, options?: GenerateTreeOptions): string => {
  const combinedOptions = { ...defaultOptions, ...options };
  const lines = flattenTree(structure, combinedOptions)
    .filter((line) => line != null)
    .join("\n");
  return lines;
};

/**
 * Returns a line of ASCII that represents
 * a single FileStructure object
 * @param structure The file to render
 * @param options The rendering options
 */
const getAsciiLine = (structure: FileStructure, options: GenerateTreeOptions): string | null => {
  const lines = LINE_STRINGS[options.charset as string];

  // Special case for the root element
  if (!structure.parent) {
    return options.rootDot ? structure.name : null;
  }

  const chunks = [isLastChild(structure) ? lines.LAST_CHILD : lines.CHILD, getName(structure, options)];

  let current = structure.parent;
  while (current && current.parent) {
    chunks.unshift(isLastChild(current) ? lines.EMPTY : lines.DIRECTORY);
    current = current.parent;
  }

  // Join all the chunks together to create the final line.
  // If we're not rendering the root `.`, chop off the first 4 characters.
  return chunks.join("").substring(options.rootDot ? 0 : lines.CHILD.length);
};

/**
 * Returns the name of a file or folder according to the
 * rules specified by the rendering rules
 * @param structure The file or folder to get the name of
 * @param options The rendering options
 */
const getName = (structure: FileStructure, options: GenerateTreeOptions): string => {
  const nameChunks = [structure.name];

  // Optionally append a trailing slash
  if (
    // if the trailing slash option is enabled
    options.trailingDirSlash &&
    // and if the item has at least one child
    structure.children.length > 0 &&
    // and if the item doesn't already have a trailing slash
    !/\/\s*$/.test(structure.name)
  ) {
    nameChunks.push("/");
  }

  // Optionally prefix the name with its full path
  if (options.fullPath && structure.parent) {
    nameChunks.unshift(getName(structure.parent, { ...options, trailingDirSlash: true }));
  }

  return nameChunks.join("");
};

/**
 * A utility function do determine if a file or folder
 * is the last child of its parent
 * @param structure The file or folder to test
 */
const isLastChild = (structure: FileStructure): boolean =>
  Boolean(structure.parent && structure.parent.children[structure.parent.children.length - 1] === structure);
