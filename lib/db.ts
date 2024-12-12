import clientPromise from './mongodb'

export async function getDb() {
  const client = await clientPromise
  const db = client.db('photoApp')
  return db
}

export async function getCollection(collectionName: string) {
  const db = await getDb()
  return db.collection(collectionName)
}

export async function findDocuments(collectionName: string, query = {}) {
  const collection = await getCollection(collectionName)
  return collection.find(query).toArray()
}

export async function insertDocument(collectionName: string, document: any) {
  const collection = await getCollection(collectionName)
  return collection.insertOne(document)
}