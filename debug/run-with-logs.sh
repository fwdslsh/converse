#!/bin/bash
exec node "$(dirname "$0")/dist/index.js" 2>> /tmp/voice-mcp.log
