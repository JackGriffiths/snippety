import toast from "solid-toast";

export function showSuccessToast(message: string) {
    toast(message, {
        style: {
            "border-radius": "2px",
            background: "hsl(120, 85%, 25%)",
            color: "white",
        },
        ariaProps: {
            role: "alert",
            "aria-live": "assertive"
        }
    });
}

export function showScreenReaderOnlyToast(message: string) {
    toast(message, {
        className: "screen-reader-only",
        ariaProps: {
            role: "alert",
            "aria-live": "assertive"
        }
    });
}
