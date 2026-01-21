import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemBar } from './item-bar';

describe('ItemBar', () => {
  let component: ItemBar;
  let fixture: ComponentFixture<ItemBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemBar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ItemBar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
