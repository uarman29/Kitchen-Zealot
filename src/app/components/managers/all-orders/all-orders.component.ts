import { Component, OnInit } from '@angular/core';
import { OrderService } from 'src/app/services/order.service';
import { Order } from 'src/app/interfaces/order';

@Component({
  selector: 'app-all-orders',
  templateUrl: './all-orders.component.html',
  styleUrls: ['./all-orders.component.css']
})
export class AllOrdersComponent implements OnInit 
{
  orders$;
  constructor(private orderServe:OrderService) 
  { 
    this.orders$ = this.orderServe.ordersObservable;
  }

  startBid(order:Order)
  {
    order.status = "BIDDING";
    this.orderServe.updateOrder(order.uid,order);
  }

  stopBid(order:Order)
  {
    if(order.currentBidder == null)
    {
      alert("No bid has been placed");
    }
    else
    {
      order.status = "BID OVER";
      this.orderServe.updateOrder(order.uid,order);
    }
  }

  ngOnInit() {
  }

}
