import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';

@Component({
  selector: 'app-item-bar',
  standalone: true,
  imports: [NgForOf],
  templateUrl: './item-bar.html',
  styleUrls: ['./item-bar.css']
})
export class ItemBarComponent {

  items = [
    { icon: '/assets/images/Item-Herz.PNG', label: '+1 LEBEN' },
    { icon: '/assets/images/Item-Schraube.PNG', label: '50 PUNKTE' },
    { icon: '/assets/images/Item-Zahnrad.PNG', label: '100 PUNKTE' },
    { icon: '/assets/images/Item-Batterie.PNG', label: '150 PUNKTE' },
    { icon: '/assets/images/Item-Box.PNG', label: '+1 LEBEN - PUNKTE X2' },
    { icon: '/assets/images/Item-Antenne.PNG', label: 'PUNKTE X2' },
    { icon: '/assets/images/Item-Scanner.PNG', label: 'SHIELD' },
    { icon: '/assets/images/Item-Timer.PNG', label: 'SLOW' },
  
  ];

}
