/**
 * Saves a JavaScript object as a JSON file and triggers a download.
 * @param filename - The desired name for the downloaded file.
 * @param data - The JavaScript object to save.
 */
export function saveJson(filename: string, data: unknown): void {
  try {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  } catch (error) {
    console.error('Error saving JSON file:', error);
  }
}

/**
 * Reads an uploaded file as text.
 * @param file - The File object to read.
 * @returns A promise that resolves with the file content as a string.
 */
export function readFileAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Reads an uploaded file as a Base64 data URL.
 * @param file The file to read.
 * @returns A promise that resolves with the Base64 data URL.
 */
export function readFileAsDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        // Add a file size check
        if (file.size > 5 * 1024 * 1024) { // 5 MB limit
            return reject(new Error('이미지 파일 크기는 5MB를 초과할 수 없습니다.'));
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}