import requests
from collections import deque

URL = "http://192.168.16.109:5000/"  # Change this to the actual host

def get_maze():
    return requests.get(URL).text

def parse_maze(maze_text):
    maze = []
    start = end = None
    for row_idx, line in enumerate(maze_text.splitlines()):
        row = list(line)
        if 'S' in row:
            start = (row_idx, row.index('S'))
        if 'E' in row:
            end = (row_idx, row.index('E'))
        maze.append(row)
    return maze, start, end

def solve(maze, start, end):
    rows, cols = len(maze), len(maze[0])
    queue = deque()
    queue.append((start, [start]))
    visited = set()
    visited.add(start)

    while queue:
        (r, c), path = queue.popleft()
        for dr, dc in [(-1,0), (1,0), (0,-1), (0,1)]:
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols:
                if maze[nr][nc] != '█' and (nr, nc) not in visited:
                    if (nr, nc) == end:
                        return path + [(nr, nc)]
                    visited.add((nr, nc))
                    queue.append(((nr, nc), path + [(nr, nc)]))
    return []

def submit_path(path):
    res = requests.post(URL, json={"path": path})
    print("📨 Server response:", res.status_code, res.text.strip())
    return res.text.strip()

def main():
    while True:
        print("📥 New maze:")
        maze_text = get_maze()
        print(maze_text)
        maze, start, end = parse_maze(maze_text)
        path = solve(maze, start, end)
        print(f"✅ Solved: {len(path)} steps. Submitting...")
        response = submit_path(path)
        if "flag" in response.lower():
            print("🏁 Flag found!")
            print(response)
            break

if __name__ == "__main__":
    main()
