"use strict";
/**
 * @af/sweph-core
 *
 * Shared types, interfaces, and utilities for @af/sweph multi-platform library.
 * This package has no native dependencies and can be used in any JavaScript environment.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
// Types and interfaces
__exportStar(require("./types"), exports);
// Constants
__exportStar(require("./constants"), exports);
// Pure utility functions
__exportStar(require("./utils"), exports);
//# sourceMappingURL=index.js.map