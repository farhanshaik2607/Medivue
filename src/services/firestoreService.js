import { db, storage } from './firebase';
import {
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, getDocs, query, where, orderBy,
    onSnapshot, runTransaction, serverTimestamp, addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ==================== USER PROFILES ====================

export async function createUserProfile(uid, data) {
    await setDoc(doc(db, 'users', uid), {
        ...data,
        createdAt: serverTimestamp(),
    });
}

export async function getUserProfile(uid) {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ==================== PHARMACY PROFILES ====================

export async function createPharmacyProfile(uid, data) {
    // Create user doc with role
    await setDoc(doc(db, 'users', uid), {
        role: 'pharmacy',
        name: data.name,
        email: data.email,
        createdAt: serverTimestamp(),
    });
    // Create pharmacy profile doc
    await setDoc(doc(db, 'pharmacies', uid), {
        name: data.pharmacyName,
        address: data.address,
        phone: data.phone,
        licenseNumber: data.licenseNumber || '',
        lat: data.lat || 0,
        lng: data.lng || 0,
        openTime: data.openTime || '09:00',
        closeTime: data.closeTime || '21:00',
        deliveryAvailable: data.deliveryAvailable || false,
        deliveryFee: data.deliveryFee || 0,
        freeDeliveryAbove: data.freeDeliveryAbove || 0,
        rating: 0,
        reviews: 0,
        isOpen: true,
        createdAt: serverTimestamp(),
    });
}

export async function getPharmacyProfile(uid) {
    const snap = await getDoc(doc(db, 'pharmacies', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updatePharmacyProfile(uid, data) {
    await updateDoc(doc(db, 'pharmacies', uid), data);
}

// ==================== INVENTORY ====================

export async function addInventoryItem(pharmacyId, item) {
    const docRef = await addDoc(collection(db, 'pharmacies', pharmacyId, 'inventory'), {
        ...item,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export async function updateInventoryItem(pharmacyId, itemId, data) {
    await updateDoc(doc(db, 'pharmacies', pharmacyId, 'inventory', itemId), data);
}

export async function deleteInventoryItem(pharmacyId, itemId) {
    await deleteDoc(doc(db, 'pharmacies', pharmacyId, 'inventory', itemId));
}

export function subscribeToInventory(pharmacyId, callback) {
    const q = query(
        collection(db, 'pharmacies', pharmacyId, 'inventory'),
        orderBy('name')
    );
    return onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(items);
    });
}

// ==================== MEDICINE REQUESTS ====================

export async function createMedicineRequest(data) {
    const docRef = await addDoc(collection(db, 'requests'), {
        ...data,
        status: 'requested',
        acceptedBy: null,
        acceptedPharmacyName: null,
        acceptedPharmacyDistance: null,
        estimatedPrice: null,
        createdAt: serverTimestamp(),
    });
    return docRef.id;
}

export function subscribeToUserRequests(userId, callback) {
    const q = query(
        collection(db, 'requests'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(requests);
    });
}

export function subscribeToPharmacyRequests(callback) {
    // Pharmacies see all 'requested' status items (filtering by distance done client-side)
    const q = query(
        collection(db, 'requests'),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        callback(requests);
    });
}

export async function acceptMedicineRequest(requestId, pharmacyData) {
    const requestRef = doc(db, 'requests', requestId);
    try {
        await runTransaction(db, async (transaction) => {
            const requestDoc = await transaction.get(requestRef);
            if (!requestDoc.exists()) throw new Error('Request not found');
            const current = requestDoc.data();
            if (current.status !== 'requested') {
                throw new Error('Request already accepted');
            }
            transaction.update(requestRef, {
                status: 'accepted',
                acceptedBy: pharmacyData.pharmacyId,
                acceptedPharmacyName: pharmacyData.pharmacyName,
                acceptedPharmacyDistance: pharmacyData.distance,
                estimatedPrice: pharmacyData.estimatedPrice || null,
                acceptedAt: serverTimestamp(),
            });
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

export async function rejectMedicineRequest(requestId, pharmacyId) {
    // Just add pharmacyId to a "rejectedBy" array (pharmacy won't see it again)
    const requestRef = doc(db, 'requests', requestId);
    const snap = await getDoc(requestRef);
    if (snap.exists()) {
        const rejected = snap.data().rejectedBy || [];
        await updateDoc(requestRef, {
            rejectedBy: [...rejected, pharmacyId],
        });
    }
}

export async function updateRequestStatus(requestId, status) {
    await updateDoc(doc(db, 'requests', requestId), { status });
}

// ==================== FILE UPLOAD ====================

export async function uploadPrescriptionImage(userId, file) {
    const storageRef = ref(storage, `prescriptions/${userId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
}
