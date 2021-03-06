import { Component, OnInit, Input } from '@angular/core';
import { CartService } from 'src/app/services/cart.service';
import { take } from 'rxjs/operators';
import { OrderService } from 'src/app/services/order.service';
import { Order } from 'src/app/interfaces/order';
import { Router } from '@angular/router';
import { CartItem } from 'src/app/interfaces/cart-item';
import { GuestService } from 'src/app/services/guest.service';
import { ProductService } from 'src/app/services/product.service';
import { Observable } from 'rxjs';
import { Product } from 'src/app/interfaces/product';
import { SelectorMatcher } from '@angular/compiler';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  userName:string = "";
  userPhone:string = "";
  customerAddress:string = "";
  customerNameOnCard:string = "";
  customerCardNumber:string = "";
  customerCVV:string = "";
  customerExpirationDate:string = "";

  order:Order = {
    contents:null,
    orderedBy:null,
    orderedOn:null,
    orderDestination:null,
    paymentDetails:{CVV:null,cardNumber:null,expirationDate:null,nameOnCard:null},
    cookedBy:null,
    deliveredBy:null,
    foodRating:null,
    deliveredOn:null,
    deliveryRating:null,
    customerRating:null,
    subtotal:0,
    tax:0,
    discount:0,
    total:0,
    currentBid:20,
    currentBidder:null,
    status:"ORDERED"
  };

  @Input('guest') guest = false;
  constructor(private cartServe:CartService,private orderServe:OrderService,private router:Router,private guestServe:GuestService,private productServe:ProductService)
  {
  }

  ngOnInit() {
    if(!this.guest)
    {
      this.cartServe.getUser().pipe(take(1)).subscribe(user=>{
        this.userName = user.name;
        this.userPhone = user.phone;
      });

      this.cartServe.getCustomer().pipe(take(1)).subscribe(customer=>{
        this.customerAddress = customer.address;
        this.customerNameOnCard = customer.paymentDetails.nameOnCard;
        this.customerCardNumber = customer.paymentDetails.cardNumber;
        this.customerExpirationDate = customer.paymentDetails.expirationDate;
        this.customerCVV = customer.paymentDetails.CVV;
      });
    }
  }

  checkout(form)
  {
    if(this.guest)
    {
      this.guestCheckout(form);
      return;
    }

    this.cartServe.getCustomer().pipe(take(1)).subscribe(customer=>{
      this.cartServe.getUser().pipe(take(1)).subscribe(user=>{
        this.order.contents = customer.shoppingCart;
        this.order.orderedBy = (user.uid.trim());
        this.order.orderedOn = new Date();
        this.order.orderDestination = form.address;
        this.order.paymentDetails.CVV = form.CVV;
        this.order.paymentDetails.cardNumber = form.cardNumber;
        this.order.paymentDetails.expirationDate = form.expirationDate;
        this.order.paymentDetails.nameOnCard = form.nameOnCard;
        for(let cartItem of this.order.contents)
        {
          if(cartItem.product.category != "FREE")
          {
            cartItem.product.orderFrequency = cartItem.product.orderFrequency ? (cartItem.product.orderFrequency + cartItem.quantity):cartItem.quantity;
            this.order.subtotal += cartItem.product.price * cartItem.quantity;
            this.productServe.update(cartItem.product.uid,cartItem.product);
          }
        }
        if(this.order.subtotal == 0)
        {
          alert("Please add an Item to the cart");
          return;
        }
        this.order.tax = this.order.subtotal * .08875;
        this.order.discount = this.order.tax;
        if(customer.rank == "Guest")
          this.order.discount = 0;
        this.order.total = this.order.subtotal + this.order.tax - this.order.discount;
        let id = this.orderServe.addOrder(this.order);
        this.order.uid = id;
        this.orderServe.updateOrder(id,this.order);
        customer.shoppingCart = [];
        this.cartServe.updateCart(customer);
        this.router.navigateByUrl("/customer/my-orders");
      })
    })
  }

  guestCheckout(form)
  {
      this.order.contents = JSON.parse(localStorage.getItem("cart")) as CartItem[];
      this.order.orderedBy = form.phone;
      this.order.orderedOn = new Date();
      this.order.orderDestination = form.address;
      this.order.paymentDetails.CVV = form.CVV;
      this.order.paymentDetails.cardNumber = form.cardNumber;
      this.order.paymentDetails.expirationDate = form.expirationDate;
      this.order.paymentDetails.nameOnCard = form.nameOnCard;
      for(let cartItem of this.order.contents)
      {
        cartItem.product.orderFrequency = cartItem.product.orderFrequency ? cartItem.product.orderFrequency + cartItem.quantity:cartItem.quantity;
        this.order.subtotal += cartItem.product.price * cartItem.quantity;
        this.productServe.update(cartItem.product.uid,cartItem.product);
      }
      if(this.order.subtotal == 0)
      {
        alert("Please add an Item to the cart");
        return;
      }
      this.order.tax = this.order.subtotal * .08875;
      this.order.discount = 0;
      this.order.total = this.order.subtotal + this.order.tax;
      let id = this.orderServe.addOrder(this.order);
      this.order.uid = id;
      this.orderServe.updateOrder(id,this.order);
      this.cartServe.cart = new Array();
      this.cartServe.cart$.next(this.cartServe.cart);
      localStorage.setItem("cart",JSON.stringify(this.cartServe.cart));
      this.guestServe.checkIfGuestExists(form.phone).pipe(take(1)).subscribe(exists=>{
        if(!exists)
        {
          let tempGuest = {
            name:form.name,
            phone:form.phone,
            address:form.address,
            paymentDetails:{
              cardNumber:form.cardNumber,
              CVV:form.CVV,
              expirationDate:form.expirationDate,
              nameOnCard:form.nameOnCard
            }
          }
          this.guestServe.addGuest(tempGuest);
        }
      })
      this.router.navigateByUrl("/guest");
  }

}
