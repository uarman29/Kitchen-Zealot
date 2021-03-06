import { Injectable } from '@angular/core';
import { AngularFirestore, AngularFirestoreCollection } from '@angular/fire/firestore';
import { Guest } from '../interfaces/guest';
import { Observable } from 'rxjs';
import { take, switchMap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GuestService 
{
  guestCollection:AngularFirestoreCollection<Guest>;
  guestsObservable:Observable<Guest[]>;

  constructor(private afs:AngularFirestore) 
  { 
    this.guestCollection = this.afs.collection("guests");
    this.guestsObservable = this.guestCollection.valueChanges({idField:"uid"});
  }

  addGuest(guest:Guest)
  {
    this.guestCollection.doc(guest.phone).set(guest);
  }

  removeGuest(phone:string)
  {
    this.afs.doc("guests/" + phone).delete();
  }

  getGuest(phone:string):Observable<Guest>
  {
    return this.afs.doc("guests/" + phone).valueChanges() as Observable<Guest>;
  }

  checkIfGuestExists(phone:string)
  {
    return this.afs.doc("guests/"+phone).get().pipe(map(guest=>{
      return guest.exists;
    }));
  }
}
