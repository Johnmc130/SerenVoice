import apiClient from "../services/apiClient";
import api from "../config/api";

export const contactService = {
  async sendMessage(data) {
    const response = await apiClient.post(api.endpoints.contacto, data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  },
};
