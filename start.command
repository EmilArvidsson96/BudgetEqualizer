#!/bin/bash
# Double-click this file to start the budget app.
# Close this window (or press Ctrl+C) to stop the server.

cd "$(dirname "$0")"

# Kill server cleanly on exit
cleanup() {
  echo ""
  echo "Stoppar servern..."
  kill "$SERVER_PID" 2>/dev/null
  exit 0
}
trap cleanup SIGINT SIGTERM

# Start Vite in the background
npm run dev &
SERVER_PID=$!

# Wait until the server responds (max ~15 s)
echo "Startar server..."
for i in $(seq 1 30); do
  if curl -s http://localhost:5173 > /dev/null 2>&1; then
    break
  fi
  sleep 0.5
done

# Open the browser
open http://localhost:5173
echo "Budget-appen körs på http://localhost:5173"
echo "Stäng det här fönstret (eller tryck Ctrl+C) för att stoppa."
echo ""

wait "$SERVER_PID"
