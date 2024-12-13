import localFont from "next/font/local";
import { useUser, useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { Toaster, toast } from 'react-hot-toast';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default function Home() {
    const { isLoaded, isSignedIn, user } = useUser();
    const { getToken } = useAuth();
    const [token, setToken] = useState<string>("");
    const [todoText, setTodoText] = useState("");
    const [todos, setTodos] = useState<Array<{ id: string, text: string, user_id: string, completed: boolean }>>([]);

    const [tempSqlToFetch, setTempSqlToFetch] = useState<string>('SELECT * FROM todos;')
    const [sqlToFetch, setSqlToFetch] = useState<string>('SELECT * FROM "main"."todos";')

    // Fetch the token when the component mounts and user is signed in
    useEffect(() => {
        async function fetchToken() {
            if (isSignedIn) {
                const jwt = await getToken();
                setToken(jwt || "");
            }
        }
        fetchToken();
    }, [isSignedIn, getToken]);

    useEffect(() => {
        async function fetchTodos() {
            if (!isSignedIn || !token) return;
            
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_STARBASEDB_URL}/query`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sql: sqlToFetch,
                        params: []
                    })
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setTodos(data.result);
                } else {
                    const errorData = await response.json();
                    toast.error(errorData.error || 'Failed to fetch todos');
                }
            } catch (error) {
                toast.error('Error fetching todos: ' + (error instanceof Error ? error.message : 'Unknown error'));
            }
        }
        
        fetchTodos();
    }, [isSignedIn, token, sqlToFetch]);

    const handleSubmit = async () => {
        if (!isSignedIn || !todoText.trim()) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_STARBASEDB_URL}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: "INSERT INTO todos (user_id, text) VALUES (context.id(), ?)",
                    params: [todoText]
                })
            });
            
            if (response.ok) {
                setTodoText(""); // Clear input after successful submission
                // Refetch todos using the existing fetchTodos logic
                const updatedResponse = await fetch(`${process.env.NEXT_PUBLIC_STARBASEDB_URL}/query`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        sql: "SELECT * FROM todos;",
                        params: []
                    })
                });
                if (updatedResponse.ok) {
                    const data = await updatedResponse.json();
                    setTodos(data.result);
                }
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                toast.error(errorData.error || 'Failed to insert todo');
            }
        } catch (error) {
            toast.error('Error adding todo: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleComplete = async (todoId: string, completed: boolean) => {
        if (!isSignedIn) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_STARBASEDB_URL}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: "UPDATE todos SET completed = ? WHERE id = ?",
                    params: [completed ? 1 : 0, todoId]
                })
            });
            
            if (response.ok) {
                // Update local state
                setTodos(todos.map(todo => 
                    todo.id === todoId ? { ...todo, completed } : todo
                ));
            } else {
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                toast.error(errorData.error || 'Failed to update todo');
            }
        } catch (error) {
            toast.error('Error updating todo: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    const handleDelete = async (todoId: string) => {
        if (!isSignedIn) return;
        
        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_STARBASEDB_URL}/query`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: "DELETE FROM todos WHERE id = ?",
                    params: [todoId]
                })
            });
            
            if (response.ok) {
                // Update local state
                setTodos(todos.filter(todo => todo.id !== todoId));
            } else {
                // Handle non-200 responses
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
                toast.error(errorData.error || 'Failed to delete todo');
            }
        } catch (error) {
            toast.error('Error deleting todo: ' + (error instanceof Error ? error.message : 'Unknown error'));
        }
    };

    return (
        <div
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]`}
        >
            <Toaster position="bottom-right" />
            <h1 className="font-bold text-3xl mb-10">StarbaseDB Auth Demo</h1>
            {isLoaded && isSignedIn && (
                <div>
                    <div>Email: {user.primaryEmailAddress?.emailAddress}</div>
                    <div>User ID: {user.id}</div>
                    <div className="flex items-center gap-2"><span>JWT:</span>
                        <pre className="overflow-x-auto max-w-[80vw]">
                            {token}
                        </pre>
                    </div>

                    <div className="mt-8">
                        <input
                            type="text"
                            value={todoText}
                            onChange={(e) => setTodoText(e.target.value)}
                            placeholder="Enter your todo"
                            className="px-4 py-2 border bg-neutral-800 rounded-lg mr-2"
                        />
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Add Todo
                        </button>
                    </div>

                    <div className="mt-8 w-full flex items-center gap-3">
                        <input
                            type="text"
                            value={tempSqlToFetch}
                            onChange={(e) => setTempSqlToFetch(e.target.value)}
                            placeholder="Enter SQL to show todos"
                            className="px-4 py-2 border bg-neutral-800 rounded-lg flex-1"
                        />
                        <button
                            onClick={() => {
                                setSqlToFetch(tempSqlToFetch)
                            }}
                            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                        >
                            Fetch Todos
                        </button>
                    </div>

                    <div className="mt-8 w-full max-w-2xl">
                        <h2 className="text-xl font-bold mb-4">Your Todos</h2>
                        <div className="bg-neutral-900 rounded-lg overflow-hidden">
                            {todos.length === 0 ? (
                                <p className="p-4 text-neutral-400">No todos yet. Add one above!</p>
                            ) : (
                                <table className="w-full">
                                    <thead className="bg-neutral-800">
                                        <tr>
                                            <th className="px-4 py-2 w-12"></th>
                                            <th className="px-4 py-2 text-left">Todo</th>
                                            <th className="px-4 py-2 text-left">User</th>
                                            <th className="px-4 py-2 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {todos.map((todo) => (
                                            <tr key={todo.id} className="border-t border-neutral-800">
                                                <td className="px-4 py-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={todo.completed}
                                                        onChange={(e) => handleComplete(todo.id, e.target.checked)}
                                                        className="w-4 h-4 rounded"
                                                    />
                                                </td>
                                                <td className="px-4 py-2">
                                                    <span className={todo.completed ? "line-through text-neutral-500" : ""}>
                                                        {todo.text}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2 text-neutral-400">
                                                    {todo.user_id}
                                                </td>
                                                <td className="px-4 py-2">
                                                    <button
                                                        onClick={() => handleDelete(todo.id)}
                                                        className="p-1 hover:bg-red-800 rounded"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
