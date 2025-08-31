const BASE_URL = 'https://0.0.0.0:7009';

export async function submitEvent(formData: FormData) {
    const res = await fetch(`${BASE_URL}/api/events`, {
        method: 'POST',
        body: formData,
    });
    return res.json();
}

export async function fetchEvents() {
    const res = await fetch(`${BASE_URL}/api/events`);
    return res.json();
}