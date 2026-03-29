import { db, storage } from './firebase';
import {
    doc, setDoc, getDoc, updateDoc, deleteDoc,
    collection, getDocs, query, where, orderBy,
    onSnapshot, runTransaction, serverTimestamp, addDoc
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ==================== USER PROFILES ====================

export async function createUserProfile(uid, data) {
    console.log('[Firestore] Creating user profile...', uid);
    await setDoc(doc(db, 'users', uid), {
        ...data,
        createdAt: serverTimestamp(),
    });
    console.log('[Firestore] User profile created.');
}

export async function getUserProfile(uid) {
    console.log('[Firestore] Fetching user profile...', uid);
    const snap = await getDoc(doc(db, 'users', uid));
    console.log('[Firestore] User profile fetched. Exists:', snap.exists());
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

// ==================== PHARMACY PROFILES ====================

export async function createPharmacyProfile(uid, data) {
    console.log('[Firestore] Creating pharmacy profile...', uid);
    // Create user doc with role
    await setDoc(doc(db, 'users', uid), {
        role: 'pharmacy',
        name: data.name,
        email: data.email,
        createdAt: serverTimestamp(),
    });
    console.log('[Firestore] Primary user doc created for pharmacy.');

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
    console.log('[Firestore] Pharmacy details doc created.');
}

export async function getPharmacyProfile(uid) {
    console.log('[Firestore] Fetching pharmacy profile...', uid);
    const snap = await getDoc(doc(db, 'pharmacies', uid));
    console.log('[Firestore] Pharmacy profile fetched. Exists:', snap.exists());
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updatePharmacyProfile(uid, data) {
    await updateDoc(doc(db, 'pharmacies', uid), data);
}

// Fetch ALL registered pharmacies from Firestore
export async function getAllRegisteredPharmacies() {
    console.log('[Firestore] Fetching all registered pharmacies...');
    const snapshot = await getDocs(collection(db, 'pharmacies'));
    const pharmacies = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log('[Firestore] Found', pharmacies.length, 'registered pharmacies.');
    return pharmacies;
}

// Fetch inventory for a specific pharmacy
export async function getPharmacyInventory(pharmacyId) {
    const snapshot = await getDocs(collection(db, 'pharmacies', pharmacyId, 'inventory'));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Fetch ALL pharmacies with their inventory (for user interface)
export async function getAllPharmaciesWithInventory() {
    console.log('[Firestore] Fetching all pharmacies with inventory...');
    const pharmacies = await getAllRegisteredPharmacies();
    const results = [];

    for (const pharmacy of pharmacies) {
        const inventory = await getPharmacyInventory(pharmacy.id);
        results.push({
            ...pharmacy,
            inventory, // Array of medicine items
            source: 'firestore',
            image: '🏥',
        });
    }

    console.log('[Firestore] Loaded inventory for', results.length, 'pharmacies.');
    return results;
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
        where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort in memory to avoid missing index errors
        requests.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
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

// ==================== ORDERS ====================

export async function createOrder(orderData) {
    try {
        const docRef = await addDoc(collection(db, 'orders'), {
            ...orderData,
            status: 'pending', // pending, accepted, rejected, ready, completed
            createdAt: serverTimestamp(),
        });
        return docRef.id;
    } catch (error) {
        console.error('🔥 CRITICAL Firebase Error in createOrder:', error);
        throw error;
    }
}

export function subscribeToUserOrders(userId, callback) {
    const q = query(
        collection(db, 'orders'),
        where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort in memory to avoid missing index errors
        orders.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        callback(orders);
    });
}

export function subscribeToPharmacyOrders(pharmacyId, callback) {
    const q = query(
        collection(db, 'orders'),
        where('pharmacyId', '==', pharmacyId)
    );
    return onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Sort in memory to avoid missing index errors
        orders.sort((a, b) => {
            const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
            const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
            return timeB - timeA;
        });
        callback(orders);
    }, (error) => {
        console.error('🔥 CRITICAL Firebase Error in subscribeToPharmacyOrders:', error);
    });
}

export async function updateOrderStatus(orderId, status) {
    await updateDoc(doc(db, 'orders', orderId), { status });
}

export function subscribeToOrder(orderId, callback) {
    return onSnapshot(doc(db, 'orders', orderId), (snapshot) => {
        if (snapshot.exists()) {
            callback({ id: snapshot.id, ...snapshot.data() });
        } else {
            callback(null);
        }
    });
}

// ==================== FILE UPLOAD ====================

export async function uploadPrescriptionImage(userId, file) {
    const storageRef = ref(storage, `prescriptions/${userId}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
}
