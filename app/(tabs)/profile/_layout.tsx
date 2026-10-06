import React from 'react';
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="Services" />
      <Stack.Screen name="AddServices" />
      <Stack.Screen name="EditProfile" />
      <Stack.Screen name="ChangePassword" />
      <Stack.Screen name="kyc" />
      <Stack.Screen name="become-provider" />
      <Stack.Screen name="favorites" />
      <Stack.Screen name="my-reviews" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="background-check" />
      <Stack.Screen name="verify-phone" />
      <Stack.Screen name="delete-account" />
      <Stack.Screen name="edit/[type]" />
    </Stack>
  );
}
