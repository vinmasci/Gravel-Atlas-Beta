import { getCollection } from './db'

export async function syncUserProfile(auth0User: any) {
  const users = await getCollection('users')
  
  // Default user data structure
  const userData = {
    auth0Id: auth0User.sub,
    email: auth0User.email,
    bioName: auth0User.name || auth0User.nickname,
    picture: auth0User.picture,
    updatedAt: new Date(),
    socialLinks: {
      instagram: "",
      strava: "",
      facebook: ""
    },
    website: "",
    // Maintain existing data if user exists
    createdAt: new Date()
  }

  // Update or create user
  await users.updateOne(
    { auth0Id: auth0User.sub },
    { 
      $set: userData,
      $setOnInsert: { createdAt: new Date() }
    },
    { upsert: true }
  )
}