const apiUrl = process.env.REACT_APP_API_BASE_URL;

export async function apiFetch(endpoint, options = {}) {
    const headers = {
        "Content-Type": "application/json",
        ...options.headers,
    };

    try {
        const response = await fetch(`${apiUrl}${endpoint}`, { ...options, headers });
        if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || "An error occurred");
        }
        return await response.json();
    } catch (error) {
        console.error("API Fetch Error:", error);
        throw error;
    }
}
