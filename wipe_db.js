import { prisma } from './lib/prisma';

async function wipe() {
  console.log('--- Wiping Match and Prediction tables ---');
  try {
    const deletedPredictions = await prisma.prediction.deleteMany({});
    console.log(`Deleted ${deletedPredictions.count} predictions.`);
    
    const deletedMatches = await prisma.match.deleteMany({});
    console.log(`Deleted ${deletedMatches.count} matches.`);
    
    console.log('--- Wipe complete ---');
  } catch (error) {
    console.error('Error during wipe:', error);
  } finally {
    await prisma.$disconnect();
  }
}

wipe();
