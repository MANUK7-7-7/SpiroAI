/** wa.me needs the number as digits only, with country code. */
export const whatsappUrl = (phone: string, text: string) => `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
