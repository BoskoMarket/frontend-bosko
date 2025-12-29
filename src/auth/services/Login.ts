// import api from "@/apiinstance";

import api from "@/core/api/axiosinstance";



interface RegisterData {
    email: string;
    password: string;
    userName: string;
    fullName: string;
}

export const loginHandler = async (email: string, password: string) => {
  
    
    try {
        const response = await api.post( '/auth/login', {
            email,
            password
        });

        
        
      
        return response.data;
    } catch (error) {
        console.error('Error en loginHandler:', error);
        throw error;
    }
}

export const registerHandler = async (data: FormData) => {

   const dataFake = {
    email: "elpulguero@gmail.com",
    firstName: "El",
    lastName: "Pulguero",
    bio: "Bio del usuario",
    phone: "123456789",
    location: "Ubicación del usuario",
    password: "123456",
    userName: "elpulguero",
    fullName: "El Pulguero"
   }
    
    
    try {
        const response = await api.post( '/auth/register',{
            email: dataFake.email,
            password: dataFake.password,
            userName: dataFake.userName,
            firstName: dataFake.firstName,
            lastName: dataFake.lastName,
            bio: dataFake.bio,
            phone: dataFake.phone,
            location: dataFake.location
        } );
        return response.data;
    } catch (error) {
        console.error('Error en registerHandler:', error);
        throw error;
    }
}